import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/firebaseConfig";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Process Google OAuth redirect result first before finishing auth initialization
    async function initAuth() {
      try {
        const redirectRes = await getRedirectResult(auth);
        if (redirectRes?.user && mounted) {
          setCurrentUser({ ...redirectRes.user });
          setUserLoggedIn(true);
        }
      } catch (err) {
        console.error("Error processing Google Auth redirect result:", err);
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (mounted) {
          if (user) {
            setCurrentUser({ ...user });
            setUserLoggedIn(true);
          } else {
            setCurrentUser(null);
            setUserLoggedIn(false);
          }
          setLoading(false);
        }
      });

      return unsubscribe;
    }

    const unsubPromise = initAuth();

    return () => {
      mounted = false;
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []);

  function reloadCurrentUser() {
    if (auth.currentUser) {
      setCurrentUser({ ...auth.currentUser });
      setUserLoggedIn(true);
    }
  }

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    setCurrentUser,
    reloadCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
