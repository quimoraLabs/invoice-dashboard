// api/my-invites.js
import { verifyToken } from "@clerk/backend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const config = {
  runtime: 'nodejs',
};

function initAdminApp() {
  if (!getApps().length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawServiceAccount) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable on server.");
    }

    let serviceAccount;
    try {
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

function getAdminFirestore() {
  initAdminApp();
  return getFirestore();
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let clerkToken = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      clerkToken = authHeader.substring(7);
    }

    if (!clerkToken && req.body) {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      clerkToken = body.clerkToken;
    }

    if (!clerkToken && req.query?.clerkToken) {
      clerkToken = req.query.clerkToken;
    }

    if (!clerkToken) {
      return res.status(400).json({ error: "Missing Clerk token in request." });
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "CLERK_SECRET_KEY is not configured on server." });
    }

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

    const verifiedClaims = await verifyToken(clerkToken, {
      secretKey,
      authorizedParties: authorizedParties.length > 0 ? authorizedParties : undefined,
    });

    const emailFromClaims = verifiedClaims?.email || verifiedClaims?.primary_email_address || verifiedClaims?.email_address;
    const effectiveEmail = (emailFromClaims || "").toLowerCase().trim();

    if (!effectiveEmail) {
      return res.status(200).json({ invites: [] });
    }

    const adminDb = getAdminFirestore();
    const invitesSnap = await adminDb
      .collection("workspace_invites")
      .where("invitedEmail", "==", effectiveEmail)
      .where("status", "==", "pending")
      .get();

    const invites = [];
    for (const doc of invitesSnap.docs) {
      const data = doc.data() || {};
      let workspaceName = data.workspaceName || "Business Workspace";

      // If workspaceName is missing, fetch from workspace doc
      if (!data.workspaceName && data.workspaceId) {
        try {
          const wsDoc = await adminDb.collection("workspaces").doc(data.workspaceId).get();
          if (wsDoc.exists) {
            workspaceName = wsDoc.data()?.name || workspaceName;
          }
        } catch (e) {
          console.warn("Could not fetch workspace name for invite:", e.message);
        }
      }

      invites.push({
        id: doc.id,
        workspaceId: data.workspaceId,
        workspaceName,
        invitedEmail: data.invitedEmail,
        role: data.role || "accountant",
        invitedBy: data.invitedBy || "",
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : null,
      });
    }

    return res.status(200).json({ invites });
  } catch (error) {
    console.error("Fetch my invites failed:", error);
    return res.status(500).json({ error: error.message });
  }
}
