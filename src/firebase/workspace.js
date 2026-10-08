import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  documentId,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const workspacesCollection = collection(db, "workspaces");
const membersCollection = collection(db, "workspace_members");
const invitesCollection = collection(db, "workspace_invites");

// Firestore 'in' query limit
const IN_QUERY_LIMIT = 10;

// ---------- Create Workspace (atomic) ----------
export async function createWorkspace(name, ownerUser) {
  if (!ownerUser?.id && !ownerUser?.uid) {
    throw new Error("Authentication required to create a workspace.");
  }
  const userId = ownerUser.id || ownerUser.uid;
  const workspaceName = (name || "My Business").trim();

  // Pre-generate workspace ID so member doc can reference it in same batch
  const workspaceRef = doc(workspacesCollection);
  const workspaceId = workspaceRef.id;
  const memberDocId = `${workspaceId}_${userId}`;
  const memberRef = doc(db, "workspace_members", memberDocId);

  const batch = writeBatch(db);

  batch.set(workspaceRef, {
    name: workspaceName,
    ownerId: userId,
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

  return {
    id: workspaceId,
    name: workspaceName,
    ownerId: userId,
    role: "owner",
  };
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
        // IMPORTANT: do NOT call callback([]) — that triggers default-ws spam
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

  return docRef.id;
}

// ---------- Listen to pending invites ----------
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
export async function revokeWorkspaceInvite(inviteId) {
  if (!inviteId) return;
  await deleteDoc(doc(db, "workspace_invites", inviteId));
}

// ---------- Remove member (with last-owner guard) ----------
export async function removeWorkspaceMember(workspaceId, memberUserId) {
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
}

// ---------- Accept pending invites (atomic batch per invite) ----------
export async function checkAndAcceptPendingInvites(user) {
  if (!user?.email || (!user?.id && !user?.uid)) return 0;
  const userId = user.id || user.uid;
  const userEmail = user.email.toLowerCase().trim();

  try {
    const q = query(
      invitesCollection,
      where("invitedEmail", "==", userEmail),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    let acceptedCount = 0;

    for (const inviteDoc of snapshot.docs) {
      const invite = inviteDoc.data();
      const memberDocId = `${invite.workspaceId}_${userId}`;

      const batch = writeBatch(db);
      batch.set(doc(db, "workspace_members", memberDocId), {
        workspaceId: invite.workspaceId,
        userId,
        email: userEmail,
        displayName: user.displayName || userEmail.split("@")[0],
        role: invite.role || "accountant",
        joinedAt: serverTimestamp(),
      });
      batch.update(doc(db, "workspace_invites", inviteDoc.id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        acceptedCount++;
      } catch (err) {
        console.error(`Failed to accept invite ${inviteDoc.id}:`, err);
        // continue — one failed invite shouldn't block others
      }
    }

    return acceptedCount;
  } catch (err) {
    console.error("Error accepting pending invites:", err);
    return 0;
  }
}
