import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import admin from "firebase-admin";
import { createClerkClient } from "@clerk/backend";

// Initialize Firebase Admin SDK with strict error handling (prevent silent fallback to applicationDefault)
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(sa)
      });
    } catch (err) {
      console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is malformed JSON. Refusing to start migration script with fallback.",
        { cause: err }
      );
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } else {
    throw new Error(
      "Missing Firebase Admin credentials. Provide valid FIREBASE_SERVICE_ACCOUNT in .env.local or set GOOGLE_APPLICATION_CREDENTIALS."
    );
  }
}


export const db = admin.firestore();
export { admin };

// Initialize Clerk Backend Client
export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// Rate-limited Clerk API caller (Max 10 requests / second)
export async function rateLimitedClerkUpdate(userId, privateMetadata) {
  await new Promise((resolve) => setTimeout(resolve, 110)); // 110ms delay enforces < 10 req/s
  return clerk.users.updateUserMetadata(userId, {
    privateMetadata
  });
}

// Exponential Backoff Retry Utility for Transient Network Failures
export async function withRetry(fn, maxRetries = 3, delay = 500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, delay * Math.pow(2, attempt - 1)));
    }
  }
}
