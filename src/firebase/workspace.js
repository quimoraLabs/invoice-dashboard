import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const workspacesCollection = collection(db, "workspaces");
const membersCollection = collection(db, "workspace_members");
const invitesCollection = collection(db, "workspace_invites");

// Create a new Workspace and add owner as first member
export async function createWorkspace(name, ownerUser) {
  if (!ownerUser?.id && !ownerUser?.uid) {
    throw new Error("Authentication required to create a workspace.");
  }
  const userId = ownerUser.id || ownerUser.uid;
  const workspaceName = (name || "My Business").trim();

  // 1. Create workspace document
  const workspaceRef = await addDoc(workspacesCollection, {
    name: workspaceName,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const workspaceId = workspaceRef.id;

  // 2. Add owner as workspace member
  const memberDocId = `${workspaceId}_${userId}`;
  await setDoc(doc(db, "workspace_members", memberDocId), {
    workspaceId,
    userId,
    email: (ownerUser.email || "").toLowerCase().trim(),
    displayName: ownerUser.displayName || "Owner",
    role: "owner",
    joinedAt: serverTimestamp(),
  });

  return {
    id: workspaceId,
    name: workspaceName,
    ownerId: userId,
    role: "owner",
  };
}

// Listen to all workspaces the user is a member of
export function listenToUserWorkspaces(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(membersCollection, where("userId", "==", userId));

  return onSnapshot(
    q,
    async (snapshot) => {
      try {
        const memberships = snapshot.docs.map((doc) => doc.data());
        if (memberships.length === 0) {
          callback([]);
          return;
        }

        const workspacePromises = memberships.map(async (membership) => {
          const wsSnap = await getDoc(doc(db, "workspaces", membership.workspaceId));
          if (wsSnap.exists()) {
            return {
              id: wsSnap.id,
              ...wsSnap.data(),
              role: membership.role || "accountant",
              joinedAt: membership.joinedAt,
            };
          }
          return null;
        });

        const workspaces = (await Promise.all(workspacePromises)).filter(Boolean);
        callback(workspaces);
      } catch (err) {
        console.error("Error fetching user workspaces:", err);
        callback([]);
      }
    },
    (err) => {
      console.error("Error in listenToUserWorkspaces:", err);
      callback([]);
    }
  );
}

// Listen to members of an active workspace
export function listenToWorkspaceMembers(workspaceId, callback) {
  if (!workspaceId) {
    callback([]);
    return () => {};
  }

  const q = query(membersCollection, where("workspaceId", "==", workspaceId));

  return onSnapshot(
    q,
    (snapshot) => {
      const members = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(members);
    },
    (err) => {
      console.error("Error listening to workspace members:", err);
      callback([]);
    }
  );
}

// Invite a new member by email with role (default: 'accountant')
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

  // 1. Check if email is already in pending invites for this workspace
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

  // 2. Create invite doc
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

// Listen to pending invites for a workspace
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
      const invites = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(invites);
    },
    (err) => {
      console.error("Error listening to workspace invites:", err);
      callback([]);
    }
  );
}

// Revoke a pending invite
export async function revokeWorkspaceInvite(inviteId) {
  if (!inviteId) return;
  const inviteRef = doc(db, "workspace_invites", inviteId);
  await deleteDoc(inviteRef);
}

// Remove a member from a workspace
export async function removeWorkspaceMember(workspaceId, memberUserId) {
  if (!workspaceId || !memberUserId) return;
  const memberDocId = `${workspaceId}_${memberUserId}`;
  await deleteDoc(doc(db, "workspace_members", memberDocId));
}

// Check and automatically accept any pending invites matching the current user's email
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

      // Add to workspace_members
      await setDoc(doc(db, "workspace_members", memberDocId), {
        workspaceId: invite.workspaceId,
        userId,
        email: userEmail,
        displayName: user.displayName || userEmail.split("@")[0],
        role: invite.role || "accountant",
        joinedAt: serverTimestamp(),
      });

      // Update invite status
      await updateDoc(doc(db, "workspace_invites", inviteDoc.id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      acceptedCount++;
    }

    return acceptedCount;
  } catch (err) {
    console.error("Error accepting pending invites:", err);
    return 0;
  }
}
