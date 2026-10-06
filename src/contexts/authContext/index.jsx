import React, { useState, useMemo, useEffect } from "react";
import { useUser, useClerk, useSession } from "@clerk/react";
import { AuthContext } from "./useAuth";
import { auth } from "../../firebase/firebaseConfig";
import { signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function syncFirebaseWithClerk() {
      if (isSignedIn && user && session) {
        try {
          console.log("🔑 Fetching Clerk token...");
          const clerkToken = await session.getToken({
            template: "firebase",
            skipCache: true,
          });

          if (!clerkToken) {
            throw new Error("Failed to retrieve Clerk session token.");
          }

          console.log("🔄 Exchanging Clerk token for Firebase Custom Token...");
          const response = await fetch("/api/create-firebase-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerkToken }),
          });

          if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            throw new Error(
              errorPayload.details || errorPayload.error || `Server returned ${response.status}`
            );
          }

          const { firebaseToken } = await response.json();
          if (!firebaseToken) throw new Error("No firebaseToken returned.");

          console.log("🔐 Signing into Firebase...");
          const userCred = await signInWithCustomToken(auth, firebaseToken);
          console.log("✅ Firebase auth success. UID:", userCred.user.uid);

          if (!isCancelled) {
            setFirebaseReady(true);
            setAuthError(null);
          }
        } catch (error) {
          console.error("❌ Auth sync failed:", error);
          if (!isCancelled) {
            setFirebaseReady(false);
            setAuthError(error.message);
          }
        }
      } else {
        if (auth.currentUser) {
          await firebaseSignOut(auth).catch(() => {});
        }
        if (!isCancelled) {
          setFirebaseReady(false);
          setAuthError(null);
        }
      }
    }

    if (isLoaded) {
      syncFirebaseWithClerk();
    }

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, session?.id]);

  const currentUser = useMemo(() => {
    if (!isSignedIn || !user || !firebaseReady) return null;
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
  }, [isSignedIn, user, firebaseReady]);

  const value = useMemo(
    () => ({
      currentUser,
      userLoggedIn: Boolean(isSignedIn) && firebaseReady,
      loading: !isLoaded || (isSignedIn && !firebaseReady && !authError),
      signOut: async () => {
        if (auth.currentUser) await firebaseSignOut(auth).catch(() => {});
        setFirebaseReady(false);
        setAuthError(null);
        return signOut({ redirectUrl: "/login" });
      },
      reloadCurrentUser: () => {},
    }),
    [currentUser, isSignedIn, isLoaded, firebaseReady, authError, signOut]
  );

  if (isSignedIn && !firebaseReady && authError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h2 className="text-base font-semibold text-foreground">Authentication Sync Failed</h2>
        <p className="text-xs text-muted-foreground break-words">{authError}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Retry
          </button>
          <button
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded || (isSignedIn && !firebaseReady)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground">
            {!isLoaded ? "Initializing Authentication..." : "Authenticating Cloud Services..."}
          </p>
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