import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import InvomoraLogo from "./InvomoraLogo";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("invomora_pwa_dismissed");
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("invomora_pwa_dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-2xl border border-primary/20 bg-surface-elevated/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 print:hidden">
      <div className="flex items-start gap-3">
        <InvomoraLogo size={42} className="shadow-md" />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground">
            Install Invomora App
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Install as a native desktop or mobile app for instant launch, fast billing, and offline access.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary-hover active:scale-95 transition cursor-pointer"
            >
              <Download size={14} />
              <span>Install Now</span>
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
