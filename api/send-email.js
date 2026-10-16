// api/send-email.js
import { verifyToken } from "@clerk/backend";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sendSecurityAlertEmail, sendWorkspaceInviteEmail, sendForgotPasscodeEmail } from "./mailer.js";

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
    } catch {
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
      } catch {
        body = {};
      }
    }

    const {
      clerkToken,
      type, // "security_alert" | "workspace_invite"
      workspaceId,
      toEmail,
      role,
      inviterName,
      details,
      actorInfo,
    } = body || {};

    if (!clerkToken) {
      return res.status(400).json({ error: "Missing clerkToken in request body." });
    }

    if (!type) {
      return res.status(400).json({ error: "Missing email type in request body." });
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

    const callerId = verifiedClaims?.sub;
    if (!callerId) {
      return res.status(401).json({ error: "Invalid Clerk token: missing subject (userId)." });
    }

    const adminDb = getAdminFirestore();

    // 1. Handle Security Alert Email
    if (type === "security_alert") {
      if (!workspaceId) {
        return res.status(400).json({ error: "Missing workspaceId for security alert." });
      }

      const wsDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
      if (!wsDoc.exists) {
        return res.status(404).json({ error: "Workspace not found." });
      }

      const wsData = wsDoc.data() || {};
      const ownerId = wsData.ownerId;

      // Find owner email from workspace_members
      let ownerEmail = null;
      if (ownerId) {
        const ownerMemberDoc = await adminDb.collection("workspace_members").doc(`${workspaceId}_${ownerId}`).get();
        if (ownerMemberDoc.exists) {
          ownerEmail = ownerMemberDoc.data()?.email;
        }
      }

      // Fallback: search for any owner role member
      if (!ownerEmail) {
        const ownersSnap = await adminDb.collection("workspace_members")
          .where("workspaceId", "==", workspaceId)
          .where("role", "==", "owner")
          .limit(1)
          .get();
        if (!ownersSnap.empty) {
          ownerEmail = ownersSnap.docs[0].data()?.email;
        }
      }

      if (!ownerEmail) {
        return res.status(404).json({ error: "Could not find owner email for this workspace." });
      }

      const sent = await sendSecurityAlertEmail({
        ownerEmail,
        workspaceName: wsData.name || "Business Workspace",
        actorInfo: actorInfo || verifiedClaims?.email || "Local Session",
        details: details || "Unauthorized passcode attempt",
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      });

      return res.status(200).json({ success: true, emailSent: sent });
    }

    // 2. Handle Workspace Invite Email
    if (type === "workspace_invite") {
      if (!workspaceId || !toEmail) {
        return res.status(400).json({ error: "Missing workspaceId or toEmail for invitation." });
      }

      const wsDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
      if (!wsDoc.exists) {
        return res.status(404).json({ error: "Workspace not found." });
      }

      const wsData = wsDoc.data() || {};
      const invitePasscode = wsData.invitePasscode || "123456";

      const sent = await sendWorkspaceInviteEmail({
        toEmail: toEmail.toLowerCase().trim(),
        workspaceName: wsData.name || "Business Workspace",
        inviterName: inviterName || verifiedClaims?.email?.split("@")[0] || "Workspace Owner",
        role: role || "accountant",
        invitePasscode,
        appUrl: req.headers.origin || "http://localhost:5173",
      });

      return res.status(200).json({ success: true, emailSent: sent });
    }

    // 3. Handle Forgot Passcode Email
    if (type === "forgot_passcode") {
      let recipientEmail = toEmail || body.ownerEmail;
      let passcode = body.passcode;
      let wsName = body.workspaceName || "Business Workspace";

      if (workspaceId && (!passcode || !recipientEmail)) {
        const wsDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
        if (wsDoc.exists) {
          const wsData = wsDoc.data() || {};
          passcode = passcode || wsData.invitePasscode;
          wsName = wsData.name || wsName;
          if (!recipientEmail && wsData.ownerId) {
            const ownerDoc = await adminDb.collection("workspace_members").doc(`${workspaceId}_${wsData.ownerId}`).get();
            if (ownerDoc.exists) recipientEmail = ownerDoc.data()?.email;
          }
        }
      }

      if (!recipientEmail || !passcode) {
        return res.status(400).json({ error: "Missing recipient email or passcode." });
      }

      const sent = await sendForgotPasscodeEmail({
        toEmail: recipientEmail.toLowerCase().trim(),
        workspaceName: wsName,
        passcode,
      });

      return res.status(200).json({ success: true, emailSent: sent });
    }

    return res.status(400).json({ error: "Unknown email type requested." });
  } catch (error) {
    console.error("[api/send-email] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
