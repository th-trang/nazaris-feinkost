import {FirebaseApp, getApp, getApps, initializeApp} from "firebase/app";
import {Auth, connectAuthEmulator, getAuth} from "firebase/auth";
import {connectFirestoreEmulator, Firestore, getFirestore} from "firebase/firestore";
import {connectFunctionsEmulator, Functions, getFunctions} from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const getFirebaseApp = (): FirebaseApp => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase environment variables are missing.");
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

let auth: Auth | null = null;
let functions: Record<string, Functions> = {};
let db: Firestore | null = null;

export const getFirebaseAuth = (): Auth => {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://localhost:9099");
  }
  return auth;
};

export const getFirebaseFunctions = (): Functions => {
  const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "europe-west3";
  if (functions[region]) return functions[region];

  functions[region] = getFunctions(getFirebaseApp(), region);
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    connectFunctionsEmulator(functions[region], "localhost", 5001);
  }
  return functions[region];
};

export const getFirebaseDb = (): Firestore => {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    connectFirestoreEmulator(db, "localhost", 8080);
  }
  return db;
};
