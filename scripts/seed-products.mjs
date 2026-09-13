#!/usr/bin/env node
/**
 * Seeds / restores the product catalogue by invoking checkAndRestoreProducts —
 * the same function the daily schedule runs in production. There is deliberately
 * no separate import logic here: the emulator and production take an identical
 * code path, so whatever you verify locally is what runs in prod.
 *
 *   node scripts/seed-products.mjs            → local emulator (waits for it to boot)
 *   node scripts/seed-products.mjs --prod     → production (token read from Secret Manager)
 *   node scripts/seed-products.mjs --force    → override the delta delete guard
 *
 * Exits non-zero if the restore aborted or errored, so it can gate CI.
 */
import {execFileSync} from "child_process";
import {readFileSync} from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGION = "europe-west3";
const FUNCTION = "checkAndRestoreProducts";

const args = new Set(process.argv.slice(2));
const isProd = args.has("--prod");
const force = args.has("--force");

const readJson = (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf-8"));
const projectId = readJson(".firebaserc").projects.default;
const functionsPort = readJson("firebase.json").emulators?.functions?.port ?? 5001;

const target = isProd ?
  `https://${REGION}-${projectId}.cloudfunctions.net/${FUNCTION}` :
  `http://127.0.0.1:${functionsPort}/${projectId}/${REGION}/${FUNCTION}`;

const url = force ? `${target}?force=true` : target;

/** Production requires the bearer token; the emulator skips auth entirely. */
function authHeader() {
  if (!isProd) return {};
  const fromEnv = process.env.RESTORE_TOKEN;
  if (fromEnv) return {Authorization: `Bearer ${fromEnv}`};
  try {
    // Never logged — read straight from Secret Manager into the request.
    const token = execFileSync(
      "firebase",
      ["functions:secrets:access", "RESTORE_TOKEN", "--project", projectId],
      {encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"]},
    ).trim();
    return {Authorization: `Bearer ${token}`};
  } catch {
    console.error(
      "[seed] Could not read RESTORE_TOKEN. Set it in the environment, or run:\n" +
      "       firebase login && firebase functions:secrets:access RESTORE_TOKEN",
    );
    process.exit(1);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The emulator takes a while to load functions, so retry while the port refuses
 * connections. Against production there is nothing to wait for — fail fast.
 */
async function post(timeoutMs) {
  const headers = {"Content-Type": "application/json", ...authHeader()};
  const deadline = Date.now() + timeoutMs;
  let announced = false;

  for (;;) {
    try {
      return await fetch(url, {method: "POST", headers, body: "{}"});
    } catch (err) {
      if (Date.now() >= deadline) throw err;
      if (!announced) {
        console.log(`[seed] Waiting for the functions emulator on port ${functionsPort}...`);
        announced = true;
      }
      await sleep(1000);
    }
  }
}

async function main() {
  console.log(`[seed] Target: ${isProd ? "PRODUCTION" : "emulator"} → ${target}`);

  const res = await post(isProd ? 0 : 120_000);
  const body = await res.text();

  let result;
  try {
    result = JSON.parse(body);
  } catch {
    console.error(`[seed] HTTP ${res.status} — unexpected response:\n${body.slice(0, 500)}`);
    process.exit(1);
  }

  if (res.status === 401) {
    console.error("[seed] Unauthorized — RESTORE_TOKEN does not match the deployed secret.");
    process.exit(1);
  }

  if (result.mode === "aborted") {
    console.error(`[seed] Aborted (nothing was written): ${result.error}`);
    console.error("[seed] Re-run with --force once you have confirmed the CSV is the good copy.");
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`[seed] HTTP ${res.status}:`, result);
    process.exit(1);
  }

  const {mode, count, skipped, deleted} = result;
  if (mode === "skipped") {
    console.log(`[seed] Up to date — ${count} products already match the CSV.`);
  } else {
    console.log(
      `[seed] ${mode} import complete: ${count} written` +
      (deleted ? `, ${deleted} deleted` : "") +
      (skipped ? `, ${skipped} rows skipped` : "") + ".",
    );
  }
}

main().catch((err) => {
  const hint = isProd ?
    "" :
    "\n[seed] Is the emulator running? Start it with: npm run emulator";
  console.error(`[seed] Failed: ${err.message}${hint}`);
  process.exit(1);
});
