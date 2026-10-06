// api/create-firebase-token.js
import { verifyToken } from "@clerk/backend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const config = {
  runtime: 'nodejs',
};

// Singleton Firebase Admin initialization
function getAdminAuth() {
  if (!getApps().length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawServiceAccount) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable on server.");
    }

    let serviceAccount;
    try {
      // Support raw JSON string or base64-encoded JSON string
      const trimmed = rawServiceAccount.trim();
      serviceAccount = trimmed.startsWith("{")
        ? JSON.parse(trimmed)
        : JSON.parse(Buffer.from(trimmed, "base64").toString("utf-8"));
    } catch (e) {
      throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT as valid JSON.");
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getAuth();
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Robust body parsing for both parsed and string body payloads
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const { clerkToken } = body || {};

    if (!clerkToken) {
      return res.status(400).json({ error: "Missing 'clerkToken' in request body." });
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "CLERK_SECRET_KEY is not configured on server." });
    }

    // Configured authorized parties from APP_URL and local environments
    const configuredParties = (process.env.APP_URL || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const authorizedParties = [
      "http://localhost:5173",
      "http://localhost:3000",
      ...configuredParties,
    ];

    // 1. Verify Clerk JWT using Clerk Backend SDK with authorized parties
    const verifiedClaims = await verifyToken(clerkToken, {
      secretKey,
      authorizedParties: authorizedParties.length > 0 ? authorizedParties : undefined,
    });

    const userId = verifiedClaims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid Clerk token: missing subject (userId)." });
    }

    // 2. Generate Firebase custom token for this userId
    const adminAuth = getAdminAuth();
    const firebaseToken = await adminAuth.createCustomToken(userId);

    // 3. Return minted token
    return res.status(200).json({ firebaseToken });
  } catch (error) {
    console.error("Token exchange failed:", error);
    return res.status(401).json({
      error: "Authentication exchange failed",
      details: error.message,
    });
  }
}
