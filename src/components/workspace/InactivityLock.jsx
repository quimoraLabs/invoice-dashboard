import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/authContext/useAuth";
import { logActivity } from "../../firebase/activity";
import toast from "react-hot-toast";
import { HiLockClosed, HiShieldExclamation, HiShieldCheck } from "react-icons/hi";

// Default inactivity timeout: 15 minutes (in milliseconds)
const DEFAULT_IDLE_TIMEOUT = 15 * 60 * 1000;
const SESSION_LOCK_KEY = "invomora_dashboard_locked";

export default function InactivityLock() {
  const { activeWorkspace, isOwner } = useWorkspace();
  const { currentUser, userLoggedIn } = useAuth();

  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem(SESSION_LOCK_KEY) === "true";
  });
  const [passcode, setPasscode] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const timeoutRef = useRef(null);
  const lastActiveRef = useRef(Date.now());

  // Lock the dashboard
  const lockDashboard = useCallback(() => {
    // Only lock if user is logged in and has an active workspace
    if (!userLoggedIn || !activeWorkspace) return;
    setIsLocked(true);
    sessionStorage.setItem(SESSION_LOCK_KEY, "true");
    setPasscode("");
    setErrorMsg("");
  }, [userLoggedIn, activeWorkspace]);

  // Reset inactivity timer on user actions
  const resetTimer = useCallback(() => {
    lastActiveRef.current = Date.now();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Only schedule if NOT locked and user is logged in
    if (!isLocked && userLoggedIn && activeWorkspace) {
      timeoutRef.current = setTimeout(() => {
        lockDashboard();
      }, DEFAULT_IDLE_TIMEOUT);
    }
  }, [isLocked, userLoggedIn, activeWorkspace, lockDashboard]);

  // Listen to user activities
  useEffect(() => {
    if (!userLoggedIn || !activeWorkspace) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    const handleActivity = () => {
      if (!isLocked) {
        resetTimer();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    window.addEventListener("invomora_lock_screen", lockDashboard);
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.removeEventListener("invomora_lock_screen", lockDashboard);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [userLoggedIn, activeWorkspace, isLocked, resetTimer, lockDashboard]);

  // Unlock attempt handler
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const entered = passcode.trim();
    if (!entered || entered.length !== 6) {
      setErrorMsg("Please enter your 6-digit security passcode.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const correctCode = String(activeWorkspace?.invitePasscode || "").trim();

    if (entered === correctCode) {
      // Success: Unlock dashboard
      setIsLocked(false);
      sessionStorage.removeItem(SESSION_LOCK_KEY);
      setPasscode("");
      setFailedAttempts(0);
      toast.success("Workspace unlocked successfully.");
      resetTimer();
    } else {
      // Failed attempt
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPasscode("");

      if (newAttempts >= 3) {
        setErrorMsg("Maximum attempts exceeded. Security alert dispatched to workspace owner.");
        toast.error("Security Alert: Unauthorized unlock attempts detected!", { duration: 5000 });

        // 1. Audit log in Firestore
        try {
          await logActivity({
            workspaceId: activeWorkspace.id,
            actor: {
              uid: currentUser?.uid || currentUser?.id || "standby",
              displayName: currentUser?.displayName || currentUser?.email || "Desk Session",
              email: currentUser?.email || "",
            },
            action: "security_alert",
            entityType: "workspace",
            entityId: activeWorkspace.id,
            entityTitle: activeWorkspace.name,
            details: `3 failed passcode attempts to unlock standby dashboard screen.`,
          });
        } catch (err) {
          console.warn("Could not log unlock alert:", err);
        }

        // 2. Dispatch automated email alert to owner
        try {
          const ownerEmail = activeWorkspace?.ownerEmail || currentUser?.email;
          if (ownerEmail) {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "security_alert",
                ownerEmail,
                workspaceName: activeWorkspace?.name || "Invomora Workspace",
                actorInfo: currentUser?.email || "Standby User / Attendant",
                details: "Repeated failed 6-digit security passcode attempts on unattended dashboard screen.",
              }),
            });
          }
        } catch (err) {
          console.warn("Could not send security alert email:", err);
        }
      } else {
        const remaining = 3 - newAttempts;
        setErrorMsg(`Incorrect passcode. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before owner email alert.`);
      }
    }

    setIsSubmitting(false);
  };

  // If not locked or user not logged in, render nothing
  if (!isLocked || !userLoggedIn || !activeWorkspace) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-slate-950/85 transition-all animate-in fade-in duration-300"
      style={{ isolation: "isolate" }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-surface-elevated border border-border shadow-2xl p-6 sm:p-8 text-center">
        {/* Shield / Lock Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-5 shadow-inner">
          <HiLockClosed size={32} className="animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground">
          Workspace Standby Lock
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          This dashboard was locked automatically due to 15 minutes of inactivity to protect sensitive financial records.
        </p>

        {/* Active Workspace Info */}
        <div className="my-4 rounded-xl bg-surface border border-border px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
          <span className="font-medium text-foreground">Active Workspace:</span>
          <span className="font-semibold text-primary">{activeWorkspace.name}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleUnlock} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="standby-passcode"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
            >
              Enter 6-Digit Passcode to Unlock
            </label>
            <input
              id="standby-passcode"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={passcode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPasscode(val);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="••••••"
              className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 rounded-xl border border-border bg-surface text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs text-left">
              <HiShieldExclamation size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || passcode.length !== 6}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <HiShieldCheck size={18} />
            <span>{isSubmitting ? "Verifying..." : "Unlock Dashboard"}</span>
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-5 text-[11px] text-muted-foreground">
          {isOwner ? (
            <span>You can find or regenerate your 6-digit passcode in Workspace Settings.</span>
          ) : (
            <span>Please contact the workspace owner if you forgot your security passcode.</span>
          )}
        </p>
      </div>
    </div>
  );
}
