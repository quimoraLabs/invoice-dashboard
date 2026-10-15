import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./authContext/useAuth";
import { useSession } from "@clerk/react";
import {
  listenToUserWorkspaces,
  createWorkspace,
  updateWorkspaceSettings,
  regenerateWorkspacePasscode,
  listenToWorkspaceMembers,
  listenToWorkspaceInvites,
  inviteMemberToWorkspace,
  revokeWorkspaceInvite,
  removeWorkspaceMember,
  fetchMyPendingInvites,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
} from "../firebase/workspace";
import toast from "react-hot-toast";

const WorkspaceContext = createContext(null);

export const STORAGE_KEY = "invomora_active_workspace_id";

export function WorkspaceProvider({ children }) {
  const { currentUser, userLoggedIn } = useAuth();
  const { session } = useSession();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [myPendingInvites, setMyPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCreatingDefaultRef = useRef(false);

  const userId = currentUser?.uid || currentUser?.id;

  // 1. Load user's received pending invitations
  const refreshMyInvites = useCallback(async () => {
    if (!userLoggedIn || !session) {
      setMyPendingInvites([]);
      return;
    }
    try {
      const clerkToken = await session.getToken().catch(() => null);
      if (clerkToken) {
        const list = await fetchMyPendingInvites(clerkToken);
        setMyPendingInvites(list);
      }
    } catch (err) {
      console.warn("Could not load user pending invitations:", err.message);
    }
  }, [userLoggedIn, session]);

  useEffect(() => {
    refreshMyInvites();
  }, [refreshMyInvites]);

  // 2. Load workspaces
  useEffect(() => {
    if (!userLoggedIn || !userId) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setMembers([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = listenToUserWorkspaces(
      userId,
      async (userWorkspaces) => {
        setWorkspaces(userWorkspaces);

        if (userWorkspaces.length === 0 && !isCreatingDefaultRef.current) {
          isCreatingDefaultRef.current = true;
          try {
            const defaultName = currentUser.displayName
              ? `${currentUser.displayName}'s Business`
              : "My Business";
            const newWs = await createWorkspace(defaultName, currentUser);
            setWorkspaces([newWs]);
            setActiveWorkspaceId(newWs.id);
            localStorage.setItem(STORAGE_KEY, newWs.id);
          } catch (err) {
            console.error("Error auto-creating default workspace:", err);
            setError(err.message || "Failed to create default workspace.");
          } finally {
            isCreatingDefaultRef.current = false;
            setLoading(false);
          }
          return;
        }

        setLoading(false);
      },
      (err) => {
        console.error("Failed to load user workspaces:", err);
        setError(err.message || "Failed to load workspaces.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userLoggedIn, userId, currentUser]);

  // 3. Resolve active workspace
  const activeWorkspace = useMemo(() => {
    if (workspaces.length === 0) return null;
    const found = workspaces.find((w) => w.id === activeWorkspaceId);
    if (found) return found;
    const fallback = workspaces[0];
    localStorage.setItem(STORAGE_KEY, fallback.id);
    return fallback;
  }, [workspaces, activeWorkspaceId]);

  // 4. Listen to members of active workspace
  useEffect(() => {
    if (!activeWorkspace?.id) {
      setMembers([]);
      return;
    }
    const unsub = listenToWorkspaceMembers(activeWorkspace.id, setMembers);
    return () => unsub();
  }, [activeWorkspace?.id]);

  // 5. Listen to pending invites (owner only)
  useEffect(() => {
    if (!activeWorkspace?.id) {
      setPendingInvites([]);
      return;
    }
    const unsub = listenToWorkspaceInvites(activeWorkspace.id, setPendingInvites);
    return () => unsub();
  }, [activeWorkspace?.id]);

  // 6. Switch workspace
  const switchWorkspace = useCallback(
    (workspaceId) => {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (target) {
        setActiveWorkspaceId(workspaceId);
        localStorage.setItem(STORAGE_KEY, workspaceId);
        toast.success(`Switched to ${target.name}`);
      }
    },
    [workspaces]
  );

  // 7. Create workspace
  const createNewWorkspace = useCallback(
    async (name) => {
      if (!currentUser) throw new Error("Authentication required.");
      const newWs = await createWorkspace(name, currentUser);
      setActiveWorkspaceId(newWs.id);
      localStorage.setItem(STORAGE_KEY, newWs.id);
      toast.success(`Workspace "${newWs.name}" created!`);
      return newWs;
    },
    [currentUser]
  );

  // 8. Workspace Settings updates
  const updateSettings = useCallback(
    async ({ name, invitePasscode }) => {
      if (!activeWorkspace?.id) throw new Error("No active workspace selected.");
      const actor = {
        uid: userId,
        displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Owner",
        email: currentUser?.email || "",
      };
      await updateWorkspaceSettings(activeWorkspace.id, { name, invitePasscode }, actor);
      toast.success("Workspace settings updated successfully!");
    },
    [activeWorkspace, userId, currentUser]
  );

  const regeneratePasscode = useCallback(async () => {
    if (!activeWorkspace?.id) throw new Error("No active workspace selected.");
    const actor = {
      uid: userId,
      displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Owner",
      email: currentUser?.email || "",
    };
    const newCode = await regenerateWorkspacePasscode(activeWorkspace.id, actor);
    toast.success(`New 6-digit passcode generated: ${newCode}`);
    return newCode;
  }, [activeWorkspace, userId, currentUser]);

  // 9. Member management
  const inviteMember = useCallback(
    async (email, role = "accountant") => {
      if (!activeWorkspace) throw new Error("No active workspace.");
      const actor = {
        uid: userId,
        displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "User",
        email: currentUser?.email || "",
      };
      return inviteMemberToWorkspace({
        workspaceId: activeWorkspace.id,
        workspaceName: activeWorkspace.name,
        invitedEmail: email,
        role,
        invitedBy: userId,
        actor,
      });
    },
    [activeWorkspace, userId, currentUser]
  );

  const revokeInvite = useCallback(
    async (inviteId) => {
      if (!activeWorkspace) return;
      const actor = {
        uid: userId,
        displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "User",
        email: currentUser?.email || "",
      };
      await revokeWorkspaceInvite(inviteId, activeWorkspace.id, actor);
    },
    [activeWorkspace, userId, currentUser]
  );

  const removeMember = useCallback(
    async (memberUserId) => {
      if (!activeWorkspace) throw new Error("No active workspace.");
      const actor = {
        uid: userId,
        displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "User",
        email: currentUser?.email || "",
      };
      await removeWorkspaceMember(activeWorkspace.id, memberUserId, actor);
    },
    [activeWorkspace, userId, currentUser]
  );

  // 10. Accept & Decline Invitations
  const acceptInvite = useCallback(
    async (inviteId, passcode) => {
      if (!session) throw new Error("You must be logged in.");
      const clerkToken = await session.getToken().catch(() => null);
      if (!clerkToken) throw new Error("Authentication token expired. Please refresh.");

      const result = await acceptWorkspaceInvite({
        inviteId,
        passcode,
        clerkToken,
        displayName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Team Member",
        userEmail: currentUser?.email || "",
      });

      toast.success(`Joined ${result.workspaceName || "workspace"} successfully!`);
      await refreshMyInvites();
      if (result.workspaceId) {
        setActiveWorkspaceId(result.workspaceId);
        localStorage.setItem(STORAGE_KEY, result.workspaceId);
      }
      return result;
    },
    [session, currentUser, refreshMyInvites]
  );

  const declineInvite = useCallback(
    async (inviteId) => {
      if (!session) throw new Error("You must be logged in.");
      const clerkToken = await session.getToken().catch(() => null);
      if (!clerkToken) throw new Error("Authentication token expired. Please refresh.");

      const result = await declineWorkspaceInvite({
        inviteId,
        clerkToken,
        userEmail: currentUser?.email || "",
      });

      toast.success("Invitation declined.");
      await refreshMyInvites();
      return result;
    },
    [session, currentUser, refreshMyInvites]
  );

  const currentRole = activeWorkspace?.role || null;
  const isOwner = currentRole === "owner";
  const isAccountant = currentRole === "accountant";
  const hasWorkspaces = workspaces.length > 0;

  const value = useMemo(
    () => ({
      activeWorkspace,
      userWorkspaces: workspaces,
      members,
      pendingInvites,
      myPendingInvites,
      currentRole,
      isOwner,
      isAccountant,
      hasWorkspaces,
      loadingWorkspace: loading,
      workspaceError: error,
      switchWorkspace,
      createNewWorkspace,
      updateSettings,
      regeneratePasscode,
      inviteMember,
      revokeInvite,
      removeMember,
      refreshMyInvites,
      acceptInvite,
      declineInvite,
    }),
    [
      activeWorkspace,
      workspaces,
      members,
      pendingInvites,
      myPendingInvites,
      currentRole,
      isOwner,
      isAccountant,
      hasWorkspaces,
      loading,
      error,
      switchWorkspace,
      createNewWorkspace,
      updateSettings,
      regeneratePasscode,
      inviteMember,
      revokeInvite,
      removeMember,
      refreshMyInvites,
      acceptInvite,
      declineInvite,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
