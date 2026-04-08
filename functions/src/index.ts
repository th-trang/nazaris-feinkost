/**
 * Cloud Functions entry point.
 *
 * Firebase discovers exported callable functions from this file.
 * Each handler lives in its own module under ./handlers/ for maintainability.
 */
import "./lib/init.js";

export {createOrder} from "./handlers/createOrder.js";
export {syncLocationsCatalog} from "./handlers/syncLocationsCatalog.js";
export {notifyUpcomingOrders, triggerUpcomingOrdersDigest} from "./handlers/notifyUpcomingOrders.js";
export {onOrderPaid} from "./handlers/onOrderPaid.js";
export {stripeWebhook} from "./handlers/stripeWebhook.js";
