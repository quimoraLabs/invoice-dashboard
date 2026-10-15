import React, { useState, useEffect } from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";
import {
  HiX,
  HiCog,
  HiKey,
  HiRefresh,
  HiClipboardCopy,
  HiCheck,
  HiShieldCheck,
} from "react-icons/hi";

export default function WorkspaceSettingsModal({ isOpen, onClose }) {
  const {
    activeWorkspace,
    isOwner,
    updateSettings,
    regeneratePasscode,
  } = useWorkspace();

  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || "");
      setPasscode(activeWorkspace.invitePasscode || "");
    }
  }, [activeWorkspace, isOpen]);

  if (!isOpen || !activeWorkspace) return null;

  const handleCopyPasscode = () => {
    if (!passcode) return;
    navigator.clipboard.writeText(passcode);
    setCopied(true);
    toast.success("Passcode copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        "Are you sure you want to regenerate the invite passcode? Anyone attempting to join with the old passcode will be blocked."
      )
    ) {
      return;
    }

    setIsRegenerating(true);
    try {
      const newCode = await regeneratePasscode();
      setPasscode(newCode);
    } catch (err) {
      toast.error(err?.message || "Failed to regenerate passcode.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name cannot be empty.");
      return;
    }

    if (passcode && passcode.trim().length !== 6) {
      toast.error("Security passcode must be exactly 6 digits.");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        name: name.trim(),
        invitePasscode: passcode ? passcode.trim() : undefined,
      });
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface-elevated border border-border shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <HiCog size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Workspace Settings
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage workspace profile and security passcode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Workspace Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
          </div>

          {/* Security Passcode Section */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiKey className="text-primary" size={18} />
                <span className="text-sm font-semibold text-foreground">
                  Invite Security Passcode
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-success bg-success-muted px-2 py-0.5 rounded-md border border-success/20">
                <HiShieldCheck size={14} /> Required to Join
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Anyone invited to this workspace must enter this 6-digit passcode to accept the invitation. This prevents unauthorized access even if your dashboard is left open.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center tracking-[0.3em] font-mono text-lg font-bold rounded-xl border border-border bg-surface-elevated py-2.5 px-4 text-foreground shadow-xs">
                {passcode || "------"}
              </div>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyPasscode}
                    className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition cursor-pointer"
                    title="Copy Passcode"
                  >
                    {copied ? (
                      <HiCheck size={16} className="text-success" />
                    ) : (
                      <HiClipboardCopy size={16} />
                    )}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition cursor-pointer disabled:opacity-50"
                    title="Generate New Passcode"
                  >
                    <HiRefresh size={16} className={isRegenerating ? "animate-spin" : ""} />
                    <span>Regenerate</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {!isOwner && (
            <p className="text-xs text-muted-foreground">
              Only workspace Owners can modify these settings.
            </p>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
            >
              Cancel
            </button>
            {isOwner && (
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
