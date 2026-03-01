import {onAuthStateChanged, User} from "firebase/auth";
import {getFirebaseAuth, isFirebaseConfigured} from "./client";

export const isStaffUser = async (user: User | null): Promise<boolean> => {
  if (!user) {
    return false;
  }

  const idTokenResult = await user.getIdTokenResult();
  return idTokenResult.claims.staff === true || idTokenResult.claims.admin === true;
};

export const isAdminUser = async (user: User | null): Promise<boolean> => {
  if (!user) {
    return false;
  }

  const idTokenResult = await user.getIdTokenResult();
  return idTokenResult.claims.admin === true;
};

export const requireStaffUser = async (user: User | null): Promise<void> => {
  const hasStaffAccess = await isStaffUser(user);
  if (!hasStaffAccess) {
    throw new Error("Staff access required.");
  }
};

export const watchAuthUser = (
  callback: (user: User | null) => void,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(getFirebaseAuth(), callback);
};
