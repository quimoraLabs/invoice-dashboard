// api/accept-invite.js
import { verifyToken } from "@clerk/backend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const {
      clerkToken,
      inviteId,
      passcode,
      action = "accept", // "accept" | "decline"
      userEmail,
      displayName,
    } = body || {};

    if (!clerkToken) {
      return res.status(400).json({ error: "Missing 'clerkToken' in request body." });
    }

    if (!inviteId) {
      return res.status(400).json({ error: "Missing 'inviteId' in request body." });
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

    const userId = verifiedClaims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid Clerk token: missing subject (userId)." });
    }

    const emailFromClaims = verifiedClaims?.email || verifiedClaims?.primary_email_address || verifiedClaims?.email_address;
    const effectiveEmail = (emailFromClaims || userEmail || "").toLowerCase().trim();

    const adminDb = getAdminFirestore();
    const inviteRef = adminDb.collection("workspace_invites").doc(inviteId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return res.status(404).json({ error: "Invitation not found." });
    }

    const inviteData = inviteSnap.data() || {};
    if (inviteData.status !== "pending") {
      return res.status(400).json({ error: `Invitation is already ${inviteData.status}.` });
    }

    if (
      inviteData.invitedEmail &&
      effectiveEmail &&
      inviteData.invitedEmail.toLowerCase().trim() !== effectiveEmail
    ) {
      return res.status(403).json({ error: "This invitation was sent to a different email address." });
    }

    // Handle DECLINE
    if (action === "decline") {
      await inviteRef.update({
        status: "declined",
        declinedAt: new Date(),
        declinedBy: userId,
      });

      return res.status(200).json({
        success: true,
        action: "declined",
        message: "Invitation declined successfully.",
      });
    }

    // Handle ACCEPT: Passcode verification is required
    const wsRef = adminDb.collection("workspaces").doc(inviteData.workspaceId);
    const wsSnap = await wsRef.get();

    if (!wsSnap.exists) {
      return res.status(404).json({ error: "Target workspace no longer exists." });
    }

    const wsData = wsSnap.data() || {};
    const expectedPasscode = wsData.invitePasscode;

    if (expectedPasscode) {
      const providedPasscode = String(passcode || "").trim();
      if (!providedPasscode || providedPasscode !== String(expectedPasscode).trim()) {
        return res.status(400).json({
          error: "Invalid 6-digit security passcode. Please ask the workspace owner for the correct passcode to join.",
        });
      }
    }

    // Validated! Batch commit membership, update invite, and log activity
    const memberDocRef = adminDb.collection("workspace_members").doc(`${inviteData.workspaceId}_${userId}`);
    const resolvedName = displayName || (effectiveEmail ? effectiveEmail.split("@")[0] : "Team Member");

    const batch = adminDb.batch();

    batch.set(
      memberDocRef,
      {
        workspaceId: inviteData.workspaceId,
        userId,
        email: effectiveEmail || inviteData.invitedEmail || "",
        displayName: resolvedName,
        role: inviteData.role || "accountant",
        joinedAt: new Date(),
      },
      { merge: true }
    );

    batch.update(inviteRef, {
      status: "accepted",
      acceptedAt: new Date(),
      acceptedBy: userId,
    });

    // Write audit log entry
    const logDocRef = adminDb.collection("activity_logs").doc();
    batch.set(logDocRef, {
      workspaceId: inviteData.workspaceId,
      actorUid: userId,
      actorName: resolvedName,
      actorEmail: effectiveEmail || "",
      action: "member_join",
      entityType: "member",
      entityId: userId,
      entityTitle: resolvedName,
      details: `${resolvedName} accepted the invitation and joined as ${inviteData.role || "accountant"}.`,
      createdAt: new Date(),
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      action: "accepted",
      workspaceId: inviteData.workspaceId,
      workspaceName: wsData.name || inviteData.workspaceName || "Business Workspace",
      role: inviteData.role || "accountant",
    });
  } catch (error) {
    console.error("Invite acceptance failed:", error);
    return res.status(500).json({
      error: "Invite acceptance failed: " + (error?.message || "Internal error"),
    });
  }
}
