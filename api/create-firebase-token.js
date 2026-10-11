// api/create-firebase-token.js
import { verifyToken } from "@clerk/backend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const config = {
  runtime: 'nodejs',
};

// Singleton Firebase Admin initialization
function initAdminApp() {
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
}

function getAdminAuth() {
  initAdminApp();
  return getAuth();
}

function getAdminFirestore() {
  initAdminApp();
  return getFirestore();
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
    const { clerkToken, workspaceId: requestedWorkspaceId } = body || {};

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
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    ].filter(Boolean);

    // 1. Verify Clerk JWT using Clerk Backend SDK with authorized parties
    const verifiedClaims = await verifyToken(clerkToken, {
      secretKey,
      authorizedParties: authorizedParties.length > 0 ? authorizedParties : undefined,
    });

    const userId = verifiedClaims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid Clerk token: missing subject (userId)." });
    }

    // 2. Resolve custom claims for B2B multi-tenancy (workspaceId & role)
    const customClaims = {};
    let resolvedWorkspaceId = null;
    let resolvedRole = null;

    // Check claims embedded in Clerk token (from template or private_metadata)
    const tokenWorkspaceId = verifiedClaims?.workspaceId || verifiedClaims?.orgId;
    const tokenRole = verifiedClaims?.role;

    if (tokenWorkspaceId && typeof tokenWorkspaceId === "string") {
      resolvedWorkspaceId = tokenWorkspaceId;
      resolvedRole = typeof tokenRole === "string" ? tokenRole : "accountant";
    }

    // If client requested a specific workspace or token didn't contain claims, resolve from Firestore
    try {
      const adminDb = getAdminFirestore();
      if (requestedWorkspaceId && typeof requestedWorkspaceId === "string") {
        const memberDoc = await adminDb
          .collection("workspace_members")
          .doc(`${requestedWorkspaceId}_${userId}`)
          .get();

        if (memberDoc.exists) {
          const data = memberDoc.data() || {};
          resolvedWorkspaceId = requestedWorkspaceId;
          resolvedRole = data.role || "accountant";
        }
      } else if (!resolvedWorkspaceId) {
        // Fallback: look up user's primary/first workspace membership
        const membershipSnap = await adminDb
          .collection("workspace_members")
          .where("userId", "==", userId)
          .limit(1)
          .get();

        if (!membershipSnap.empty) {
          const firstDoc = membershipSnap.docs[0].data() || {};
          resolvedWorkspaceId = firstDoc.workspaceId;
          resolvedRole = firstDoc.role || "accountant";
        }
      }
    } catch (dbErr) {
      console.warn("Could not resolve workspace membership from Firestore Admin:", dbErr.message);
    }

    if (resolvedWorkspaceId) {
      customClaims.workspaceId = resolvedWorkspaceId;
      if (resolvedRole) {
        customClaims.role = resolvedRole;
      }
    }

    // 3. Generate Firebase custom token with claims
    const adminAuth = getAdminAuth();
    const firebaseToken = Object.keys(customClaims).length > 0
      ? await adminAuth.createCustomToken(userId, customClaims)
      : await adminAuth.createCustomToken(userId);

    // 4. Return minted token
    return res.status(200).json({
      firebaseToken,
      claims: customClaims,
    });
  } catch (error) {
    console.error("Token exchange failed:", error);
    return res.status(401).json({
      error: "Authentication exchange failed",
    });
  }
}
