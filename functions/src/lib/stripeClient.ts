/**
 * Shared Stripe wiring for the callable functions.
 *
 * The secret is the same one the webhook already uses, so it only has to be
 * granted to the new functions — no new credential to provision.
 */
import {defineSecret} from "firebase-functions/params";
import Stripe from "stripe";

export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

export const getStripe = (): Stripe => new Stripe(stripeSecretKey.value());
