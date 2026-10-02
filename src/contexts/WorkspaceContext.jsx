import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "./authContext/useAuth";
import {
  listenToUserWorkspaces,
  createWorkspace,
  checkAndAcceptPendingInvites,
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
  const [loading, setLoading] = useState(true);
  const [isCreatingDefault, setIsCreatingDefault] = useState(false);

  const userId = currentUser?.uid || currentUser?.id;

  // 1. Listen to user workspaces and accept any pending email invites
  useEffect(() => {
    if (!userLoggedIn || !userId) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check for pending invites matching user's email
    checkAndAcceptPendingInvites(currentUser)
      .then((acceptedCount) => {
        if (acceptedCount > 0) {
          toast.success(`You joined ${acceptedCount} new workspace(s)!`);
        }
      })
      .catch((err) => console.error("Error auto-joining invited workspaces:", err));

    // Real-time listener for user workspaces
    const unsubscribe = listenToUserWorkspaces(userId, async (userWorkspaces) => {
      setWorkspaces(userWorkspaces);

      // Auto-create default workspace if user has zero workspaces
      if (userWorkspaces.length === 0 && !isCreatingDefault) {
        setIsCreatingDefault(true);
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
        } finally {
          setIsCreatingDefault(false);
          setLoading(false);
        }
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [userLoggedIn, userId, currentUser]);

  // 2. Resolve Active Workspace
  const activeWorkspace = useMemo(() => {
    if (workspaces.length === 0) return null;
    const found = workspaces.find((w) => w.id === activeWorkspaceId);
    if (found) return found;
    // Default to the first available workspace
    const fallback = workspaces[0];
    localStorage.setItem(STORAGE_KEY, fallback.id);
    return fallback;
  }, [workspaces, activeWorkspaceId]);

  // 3. Switch active workspace
  const switchWorkspace = useCallback((workspaceId) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      setActiveWorkspaceId(workspaceId);
      localStorage.setItem(STORAGE_KEY, workspaceId);
      toast.success(`Switched to ${target.name}`);
    }
  }, [workspaces]);

  // 4. Create a new workspace
  const createNewWorkspace = useCallback(async (name) => {
    if (!currentUser) throw new Error("Authentication required.");
    const newWs = await createWorkspace(name, currentUser);
    setActiveWorkspaceId(newWs.id);
    localStorage.setItem(STORAGE_KEY, newWs.id);
    toast.success(`Workspace "${newWs.name}" created!`);
    return newWs;
  }, [currentUser]);

  const currentRole = activeWorkspace?.role || "owner";
  const isOwner = currentRole === "owner";
  const isAccountant = currentRole === "accountant";

  const value = useMemo(
    () => ({
      activeWorkspace,
      userWorkspaces: workspaces,
      currentRole,
      isOwner,
      isAccountant,
      loadingWorkspace: loading,
      switchWorkspace,
      createNewWorkspace,
    }),
    [
      activeWorkspace,
      workspaces,
      currentRole,
      isOwner,
      isAccountant,
      loading,
      switchWorkspace,
      createNewWorkspace,
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
