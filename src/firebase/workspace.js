import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  documentId,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { logActivity } from "./activity";

const workspacesCollection = collection(db, "workspaces");
const membersCollection = collection(db, "workspace_members");
const invitesCollection = collection(db, "workspace_invites");

// Firestore 'in' query limit
const IN_QUERY_LIMIT = 10;

// Helper to generate secure 6-digit numeric string
export function generate6DigitPasscode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ---------- Create Workspace (atomic) ----------
export async function createWorkspace(name, ownerUser) {
  if (!ownerUser?.id && !ownerUser?.uid) {
    throw new Error("Authentication required to create a workspace.");
  }
  const userId = ownerUser.id || ownerUser.uid;
  const workspaceName = (name || "My Business").trim();
  const invitePasscode = generate6DigitPasscode();

  // Pre-generate workspace ID so member doc can reference it in same batch
  const workspaceRef = doc(workspacesCollection);
  const workspaceId = workspaceRef.id;
  const memberDocId = `${workspaceId}_${userId}`;
  const memberRef = doc(db, "workspace_members", memberDocId);

  const batch = writeBatch(db);

  batch.set(workspaceRef, {
    name: workspaceName,
    ownerId: userId,
    invitePasscode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(memberRef, {
    workspaceId,
    userId,
    email: (ownerUser.email || "").toLowerCase().trim(),
    displayName: ownerUser.displayName || "Owner",
    role: "owner",
    joinedAt: serverTimestamp(),
  });

  await batch.commit();

  await logActivity({
    workspaceId,
    actor: {
      uid: userId,
      displayName: ownerUser.displayName || "Owner",
      email: ownerUser.email || "",
    },
    action: "workspace_create",
    entityType: "workspace",
    entityId: workspaceId,
    entityTitle: workspaceName,
    details: `Workspace "${workspaceName}" was created.`,
  });

  return {
    id: workspaceId,
    name: workspaceName,
    ownerId: userId,
    invitePasscode,
    role: "owner",
  };
}

// ---------- Update Workspace Settings (Owner only) ----------
export async function updateWorkspaceSettings(workspaceId, { name, invitePasscode }, actor) {
  if (!workspaceId) throw new Error("Workspace ID is required.");
  const wsRef = doc(db, "workspaces", workspaceId);

  const updates = { updatedAt: serverTimestamp() };
  if (name && name.trim()) {
    updates.name = name.trim();
  }
  if (invitePasscode && String(invitePasscode).trim().length === 6) {
    updates.invitePasscode = String(invitePasscode).trim();
  }

  await updateDoc(wsRef, updates);

  await logActivity({
    workspaceId,
    actor,
    action: "workspace_update",
    entityType: "workspace",
    entityId: workspaceId,
    entityTitle: name || "Settings",
    details: `Updated workspace settings${name ? ` (Name: "${name}")` : ""}${invitePasscode ? " (Passcode regenerated)" : ""}.`,
  });
}

// ---------- Regenerate Workspace Passcode ----------
export async function regenerateWorkspacePasscode(workspaceId, actor) {
  const newPasscode = generate6DigitPasscode();
  await updateWorkspaceSettings(workspaceId, { invitePasscode: newPasscode }, actor);
  return newPasscode;
}

// ---------- Get Workspace By ID ----------
export async function getWorkspaceById(workspaceId) {
  if (!workspaceId) return null;
  const wsRef = doc(db, "workspaces", workspaceId);
  const snap = await getDoc(wsRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ---------- Listen to user workspaces (N+1 fixed) ----------
export function listenToUserWorkspaces(userId, callback, onError) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(membersCollection, where("userId", "==", userId));

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const memberships = snapshot.docs.map((d) => d.data());

        if (memberships.length === 0) {
          callback([]);
          return;
        }

        const workspaceIds = memberships.map((m) => m.workspaceId);
        const roleMap = new Map(
          memberships.map((m) => [m.workspaceId, m.role])
        );
        const joinedMap = new Map(
          memberships.map((m) => [m.workspaceId, m.joinedAt])
        );

        // Chunk into batches of 10
        const chunks = [];
        for (let i = 0; i < workspaceIds.length; i += IN_QUERY_LIMIT) {
          chunks.push(workspaceIds.slice(i, i + IN_QUERY_LIMIT));
        }

        const workspaceDocs = await Promise.all(
          chunks.map((chunk) =>
            getDocs(
              query(workspacesCollection, where(documentId(), "in", chunk))
            )
          )
        );

        const workspaces = workspaceDocs
          .flatMap((snap) => snap.docs)
          .map((wsDoc) => ({
            id: wsDoc.id,
            ...wsDoc.data(),
            role: roleMap.get(wsDoc.id) || "accountant",
            joinedAt: joinedMap.get(wsDoc.id),
          }));

        callback(workspaces);
      } catch (err) {
        console.error("Error fetching user workspaces:", err);
        if (onError) onError(err);
      }
    },
    (err) => {
      console.error("Error in listenToUserWorkspaces:", err);
      if (onError) onError(err);
    }
  );
}

// ---------- Listen to workspace members ----------
export function listenToWorkspaceMembers(workspaceId, callback) {
  if (!workspaceId) {
    callback([]);
    return () => {};
  }

  const q = query(membersCollection, where("workspaceId", "==", workspaceId));

  return onSnapshot(
    q,
    (snapshot) => {
      const members = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(members);
    },
    (err) => {
      console.error("Error listening to workspace members:", err);
      callback([]);
    }
  );
}

// ---------- Invite member ----------
export async function inviteMemberToWorkspace({
  workspaceId,
  workspaceName,
  invitedEmail,
  role = "accountant",
  invitedBy,
  actor,
}) {
  if (!workspaceId || !invitedEmail) {
    throw new Error("Workspace ID and email are required to send invite.");
  }
  const emailClean = invitedEmail.toLowerCase().trim();

  // Duplicate pending invite check
  const qExisting = query(
    invitesCollection,
    where("workspaceId", "==", workspaceId),
    where("invitedEmail", "==", emailClean),
    where("status", "==", "pending")
  );
  const existingInvites = await getDocs(qExisting);
  if (!existingInvites.empty) {
    throw new Error("An invitation has already been sent to this email.");
  }

  const docRef = await addDoc(invitesCollection, {
    workspaceId,
    workspaceName: workspaceName || "Business Workspace",
    invitedEmail: emailClean,
    role: role || "accountant",
    invitedBy: invitedBy || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await logActivity({
    workspaceId,
    actor: actor || { uid: invitedBy },
    action: "member_invite",
    entityType: "member",
    entityId: emailClean,
    entityTitle: emailClean,
    details: `Invited ${emailClean} to join workspace as ${role}.`,
  });

  return docRef.id;
}

// ---------- Listen to pending invites (Workspace Owner View) ----------
export function listenToWorkspaceInvites(workspaceId, callback) {
  if (!workspaceId) {
    callback([]);
    return () => {};
  }

  const q = query(
    invitesCollection,
    where("workspaceId", "==", workspaceId),
    where("status", "==", "pending")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const invites = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(invites);
    },
    (err) => {
      console.error("Error listening to workspace invites:", err);
      callback([]);
    }
  );
}

// ---------- Revoke invite ----------
export async function revokeWorkspaceInvite(inviteId, workspaceId, actor) {
  if (!inviteId) return;
  await deleteDoc(doc(db, "workspace_invites", inviteId));

  if (workspaceId) {
    await logActivity({
      workspaceId,
      actor,
      action: "member_remove",
      entityType: "member",
      entityId: inviteId,
      entityTitle: "Invitation Revoked",
      details: "Cancelled pending invitation.",
    });
  }
}

// ---------- Remove member (with last-owner guard) ----------
export async function removeWorkspaceMember(workspaceId, memberUserId, actor) {
  if (!workspaceId || !memberUserId) return;

  const memberDocId = `${workspaceId}_${memberUserId}`;
  const memberRef = doc(db, "workspace_members", memberDocId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) return;
  const member = memberSnap.data();

  // Prevent removing the last owner
  if (member.role === "owner") {
    const ownersQuery = query(
      membersCollection,
      where("workspaceId", "==", workspaceId),
      where("role", "==", "owner")
    );
    const ownersSnap = await getDocs(ownersQuery);
    if (ownersSnap.size <= 1) {
      throw new Error("Cannot remove the last owner of a workspace.");
    }
  }

  await deleteDoc(memberRef);

  await logActivity({
    workspaceId,
    actor,
    action: "member_remove",
    entityType: "member",
    entityId: memberUserId,
    entityTitle: member.displayName || member.email || "Member",
    details: `Removed ${member.displayName || member.email || "member"} from workspace.`,
  });
}

// ---------- Fetch Pending Invites for Current User ----------
export async function fetchMyPendingInvites(clerkToken) {
  if (!clerkToken) return [];

  try {
    const res = await fetch("/api/my-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkToken }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch pending invitations.");
    }

    const data = await res.json();
    return data.invites || [];
  } catch (err) {
    console.error("Error fetching user invitations:", err);
    return [];
  }
}

// ---------- Accept Pending Invite with Passcode ----------
export async function acceptWorkspaceInvite({
  inviteId,
  passcode,
  clerkToken,
  displayName,
  userEmail,
}) {
  if (!inviteId) throw new Error("Invite ID is required.");
  if (!passcode || String(passcode).trim().length !== 6) {
    throw new Error("A valid 6-digit security passcode is required.");
  }
  if (!clerkToken) throw new Error("Authentication token is required.");

  const res = await fetch("/api/accept-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clerkToken,
      inviteId,
      passcode: String(passcode).trim(),
      action: "accept",
      displayName,
      userEmail,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to accept invitation.");
  }

  return data;
}

// ---------- Decline Pending Invite ----------
export async function declineWorkspaceInvite({
  inviteId,
  clerkToken,
  userEmail,
}) {
  if (!inviteId) throw new Error("Invite ID is required.");
  if (!clerkToken) throw new Error("Authentication token is required.");

  const res = await fetch("/api/accept-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clerkToken,
      inviteId,
      action: "decline",
      userEmail,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to decline invitation.");
  }

  return data;
}
