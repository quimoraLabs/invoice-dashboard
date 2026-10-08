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
import {
  listenToUserWorkspaces,
  createWorkspace,
  checkAndAcceptPendingInvites,
  listenToWorkspaceMembers,
  listenToWorkspaceInvites,
  inviteMemberToWorkspace,
  revokeWorkspaceInvite,
  removeWorkspaceMember,
} from "../firebase/workspace";
import toast from "react-hot-toast";

const WorkspaceContext = createContext(null);

export const STORAGE_KEY = "invomora_active_workspace_id";

export function WorkspaceProvider({ children }) {
  const { currentUser, userLoggedIn } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCreatingDefaultRef = useRef(false);

  const userId = currentUser?.uid || currentUser?.id;

  // 1. Load workspaces + auto-accept invites
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

    checkAndAcceptPendingInvites(currentUser)
      .then((acceptedCount) => {
        if (acceptedCount > 0) {
          toast.success(`You joined ${acceptedCount} new workspace(s)!`);
        }
      })
      .catch((err) =>
        console.error("Error auto-joining invited workspaces:", err)
      );

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

  // 2. Resolve active workspace
  const activeWorkspace = useMemo(() => {
    if (workspaces.length === 0) return null;
    const found = workspaces.find((w) => w.id === activeWorkspaceId);
    if (found) return found;
    const fallback = workspaces[0];
    localStorage.setItem(STORAGE_KEY, fallback.id);
    return fallback;
  }, [workspaces, activeWorkspaceId]);

  // 3. Listen to members of active workspace
  useEffect(() => {
    if (!activeWorkspace?.id) {
      setMembers([]);
      return;
    }
    const unsub = listenToWorkspaceMembers(activeWorkspace.id, setMembers);
    return () => unsub();
  }, [activeWorkspace?.id]);

  // 4. Listen to pending invites (owner only, but listener harmless)
  useEffect(() => {
    if (!activeWorkspace?.id) {
      setPendingInvites([]);
      return;
    }
    const unsub = listenToWorkspaceInvites(activeWorkspace.id, setPendingInvites);
    return () => unsub();
  }, [activeWorkspace?.id]);

  // 5. Switch workspace
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

  // 6. Create workspace
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

  // 7. Member actions (owner-only guards enforced by rules too)
  const inviteMember = useCallback(
    async (email, role = "accountant") => {
      if (!activeWorkspace) throw new Error("No active workspace.");
      return inviteMemberToWorkspace({
        workspaceId: activeWorkspace.id,
        workspaceName: activeWorkspace.name,
        invitedEmail: email,
        role,
        invitedBy: userId,
      });
    },
    [activeWorkspace, userId]
  );

  const revokeInvite = useCallback(async (inviteId) => {
    await revokeWorkspaceInvite(inviteId);
  }, []);

  const removeMember = useCallback(
    async (memberUserId) => {
      if (!activeWorkspace) throw new Error("No active workspace.");
      await removeWorkspaceMember(activeWorkspace.id, memberUserId);
    },
    [activeWorkspace]
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
      currentRole,
      isOwner,
      isAccountant,
      hasWorkspaces,
      loadingWorkspace: loading,
      workspaceError: error,
      switchWorkspace,
      createNewWorkspace,
      inviteMember,
      revokeInvite,
      removeMember,
    }),
    [
      activeWorkspace,
      workspaces,
      members,
      pendingInvites,
      currentRole,
      isOwner,
      isAccountant,
      hasWorkspaces,
      loading,
      error,
      switchWorkspace,
      createNewWorkspace,
      inviteMember,
      revokeInvite,
      removeMember,
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
