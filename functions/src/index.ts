/**
 * Cloud Functions entry point.
 *
 * Firebase discovers exported callable functions from this file.
 * Each handler lives in its own module under ./handlers/ for maintainability.
 */
import "./lib/init.js";

export {createOrder} from "./handlers/createOrder.js";
export {setStaffClaim} from "./handlers/setStaffClaim.js";
export {syncLocationsCatalog} from "./handlers/syncLocationsCatalog.js";
export {listStaffUsers, createStaffUser, updateStaffUser, deleteStaffUser, resetStaffUserPassword} from "./handlers/staffUsers.js";
