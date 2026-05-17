import type { CheckoutFormData } from "@/app/[locale]/checkout/useCheckout";
import type { CartItem } from "@/app/context/CartContext";

const PREFIX = "checkout_";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SavedCheckoutState {
  formData: CheckoutFormData;
  cartItems: CartItem[];
  savedAt: number;
}

/**
 * Save checkout form state and cart items to localStorage.
 * Returns the generated key.
 */
export function saveCheckoutState(formData: CheckoutFormData, cartItems: CartItem[]): string {
  const key = `${PREFIX}${Date.now()}`;
  const entry: SavedCheckoutState = { formData, cartItems, savedAt: Date.now() };
  localStorage.setItem(key, JSON.stringify(entry));
  return key;
}

/**
 * Append the checkout state key to a return URL as ?ref= (or &ref=).
 */
export function buildReturnUrl(baseUrl: string, key: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("ref", key);
  return url.toString();
}

/**
 * Read ?ref= from the current URL, fetch the matching localStorage entry,
 * validate TTL, and return the parsed state (or null).
 */
export function restoreCheckoutState(): SavedCheckoutState | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const key = params.get("ref");
  if (!key) return null;

  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed: SavedCheckoutState = JSON.parse(raw);

    // TTL check — discard entries older than 24 hours
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    // Corrupted entry — clean up
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Remove a checkout state entry from localStorage.
 */
export function clearCheckoutState(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Extract the ref key from the current URL search params (if present).
 */
export function getCheckoutStateKey(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}
