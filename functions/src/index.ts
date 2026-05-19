/**
 * Cloud Functions entry point.
 *
 * Firebase discovers exported callable functions from this file.
 * Each handler lives in its own module under ./handlers/ for maintainability.
 */
import "./lib/init.js";

// Connect to emulators when running locally so Storage + Firestore calls
// are routed to the emulator suite instead of production.
if (process.env.FUNCTIONS_EMULATOR === "true") {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";
}

export {createOrder} from "./handlers/createOrder.js";
export {syncLocationsCatalog} from "./handlers/syncLocationsCatalog.js";
export {notifyUpcomingOrders, triggerUpcomingOrdersDigest} from "./handlers/notifyUpcomingOrders.js";
export {onOrderPaid} from "./handlers/onOrderPaid.js";
export {stripeWebhook} from "./handlers/stripeWebhook.js";
export {checkAndRestoreProducts, scheduledProductCheck} from "./csv-failsafe/checkAndRestore.js";
export {exportProductsToCSV} from "./csv-failsafe/exportToCSV.js";
