// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Dynamically use window hostname in production so auth handler runs on same first-party domain
const getAuthDomain = () => {
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return window.location.hostname;
  }
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "invoice-dashboard-daedb.firebaseapp.com";
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);