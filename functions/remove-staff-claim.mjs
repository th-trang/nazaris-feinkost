import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultServiceAccountPath = path.join(
  __dirname,
  "nazaris-feinkost-firebase-adminsdk-fbsvc-55e5a0c2bd.json",
);

const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultServiceAccountPath;

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8"),
);

const email = process.argv[2];
if (!email) {
  console.error("Usage: node remove-staff-claim.mjs <staff-email>");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const user = await admin.auth().getUserByEmail(email);
const current = user.customClaims || {};

delete current.staff;

await admin.auth().setCustomUserClaims(user.uid, current);

console.log(`staff claim removed for ${email} (uid: ${user.uid})`);
console.log(`Using service account: ${serviceAccountPath}`);

// cd functions then npm run staff:remove -- staff@email.com