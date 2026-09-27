import React, { useMemo, useEffect } from "react";
import { useUser, useClerk, useSession } from "@clerk/react";
import { AuthContext } from "./useAuth";
import { auth } from "../../firebase/firebaseConfig";
import { signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();

  useEffect(() => {
    async function syncFirebaseWithClerk() {
      if (isSignedIn && user) {
        try {
          if (session?.getToken) {
            const token = await session.getToken({ template: "firebase" });
            if (token) {
              await signInWithCustomToken(auth, token);
            }
          }
        } catch (error) {
          console.warn(
            "Clerk-Firebase Auth Sync Notice: Configure JWT Template named 'firebase' in Clerk Dashboard -> JWT Templates for custom token exchange.",
            error
          );
        }
      } else {
        if (auth.currentUser) {
          await firebaseSignOut(auth).catch(() => {});
        }
      }
    }
    syncFirebaseWithClerk();
  }, [isSignedIn, user, session]);

  const currentUser = useMemo(() => {
    if (!isSignedIn || !user) return null;
    return {
      uid: user.id,
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      displayName:
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "User",
      photoURL: user.imageUrl || "",
      clerkUser: user,
    };
  }, [isSignedIn, user]);

  const value = useMemo(
    () => ({
      currentUser,
      userLoggedIn: Boolean(isSignedIn),
      loading: !isLoaded,
      signOut: () => signOut({ redirectUrl: "/login" }),
      reloadCurrentUser: () => {},
    }),
    [currentUser, isSignedIn, isLoaded, signOut]
  );

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Initializing Authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
