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
    const { clerkToken, inviteId, userEmail, displayName } = body || {};

    if (!clerkToken) {
      return res.status(400).json({ error: "Missing 'clerkToken' in request body." });
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

    if (!effectiveEmail && !inviteId) {
      return res.status(400).json({ error: "Either userEmail or inviteId must be provided." });
    }

    const adminDb = getAdminFirestore();
    let acceptedCount = 0;
    const acceptedWorkspaces = [];

    if (inviteId) {
      const inviteRef = adminDb.collection("workspace_invites").doc(inviteId);
      const inviteSnap = await inviteRef.get();

      if (!inviteSnap.exists) {
        return res.status(404).json({ error: "Invite not found." });
      }

      const inviteData = inviteSnap.data() || {};
      if (inviteData.status !== "pending") {
        return res.status(400).json({ error: `Invite is already ${inviteData.status}.` });
      }

      if (inviteData.invitedEmail && effectiveEmail && inviteData.invitedEmail.toLowerCase() !== effectiveEmail) {
        return res.status(403).json({ error: "This invitation was sent to a different email address." });
      }

      const memberDocRef = adminDb.collection("workspace_members").doc(`${inviteData.workspaceId}_${userId}`);
      const batch = adminDb.batch();

      batch.set(
        memberDocRef,
        {
          workspaceId: inviteData.workspaceId,
          userId,
          email: effectiveEmail || inviteData.invitedEmail || "",
          displayName: displayName || (effectiveEmail ? effectiveEmail.split("@")[0] : "Team Member"),
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

      await batch.commit();
      acceptedCount = 1;
      acceptedWorkspaces.push({ workspaceId: inviteData.workspaceId, role: inviteData.role || "accountant" });
    } else {
      const invitesSnap = await adminDb
        .collection("workspace_invites")
        .where("invitedEmail", "==", effectiveEmail)
        .where("status", "==", "pending")
        .get();

      if (!invitesSnap.empty) {
        const batch = adminDb.batch();
        for (const doc of invitesSnap.docs) {
          const invite = doc.data() || {};
          const memberDocRef = adminDb.collection("workspace_members").doc(`${invite.workspaceId}_${userId}`);

          batch.set(
            memberDocRef,
            {
              workspaceId: invite.workspaceId,
              userId,
              email: effectiveEmail,
              displayName: displayName || effectiveEmail.split("@")[0],
              role: invite.role || "accountant",
              joinedAt: new Date(),
            },
            { merge: true }
          );

          batch.update(doc.ref, {
            status: "accepted",
            acceptedAt: new Date(),
            acceptedBy: userId,
          });

          acceptedCount++;
          acceptedWorkspaces.push({ workspaceId: invite.workspaceId, role: invite.role || "accountant" });
        }
        await batch.commit();
      }
    }

    return res.status(200).json({
      success: true,
      acceptedCount,
      acceptedWorkspaces,
    });
  } catch (error) {
    console.error("Invite acceptance failed:", error);
    return res.status(500).json({
      error: "Invite acceptance failed: " + (error?.message || "Internal error"),
    });
  }
}
