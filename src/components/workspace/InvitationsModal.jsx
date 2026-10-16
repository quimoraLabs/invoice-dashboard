import React, { useState } from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import toast from "react-hot-toast";
import {
  X,
  Mail,
  Key,
  Check,
  Trash2,
  Building2,
} from "lucide-react";

export default function InvitationsModal({ isOpen, onClose }) {
  const { myPendingInvites, acceptInvite, declineInvite } = useWorkspace();
  const [passcodes, setPasscodes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  if (!isOpen) return null;

  const handlePasscodeChange = (inviteId, value) => {
    // Only allow numeric input up to 6 digits
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setPasscodes((prev) => ({ ...prev, [inviteId]: cleaned }));
  };

  const handleAccept = async (invite) => {
    const code = (passcodes[invite.id] || "").trim();
    if (!code || code.length !== 6) {
      toast.error("Please enter the 6-digit security passcode provided by the owner.");
      return;
    }

    setProcessingId(invite.id);
    try {
      await acceptInvite(invite.id, code);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to accept invitation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invite) => {
    if (!window.confirm(`Are you sure you want to decline the invitation to join "${invite.workspaceName}"?`)) {
      return;
    }

    setProcessingId(invite.id);
    try {
      await declineInvite(invite.id);
    } catch (err) {
      toast.error(err?.message || "Failed to decline invitation.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface-elevated border border-border shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Workspace Invitations
              </h3>
              <p className="text-xs text-muted-foreground">
                {myPendingInvites.length} pending invitation{myPendingInvites.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
          {myPendingInvites.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-border text-muted-foreground mb-3">
                <Mail size={24} />
              </div>
              <p className="text-sm font-semibold text-foreground">No Pending Invitations</p>
              <p className="text-xs text-muted-foreground mt-1">
                When a business owner invites you to their workspace, the invitation will appear here with passcode protection.
              </p>
            </div>
          ) : (
            myPendingInvites.map((invite) => {
              const currentPasscode = passcodes[invite.id] || "";
              const isProcessing = processingId === invite.id;

              return (
                <div
                  key={invite.id}
                  className="rounded-xl border border-border bg-surface p-4 space-y-3.5 transition hover:border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary font-bold text-sm">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {invite.workspaceName || "Business Workspace"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Role: <span className="capitalize font-medium text-foreground">{invite.role || "accountant"}</span>
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold">
                      Pending Passcode
                    </span>
                  </div>

                  {/* Passcode input for this invite */}
                  <div className="rounded-xl bg-surface-elevated border border-border p-3 space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Key size={14} className="text-primary" />
                      Enter 6-Digit Owner Passcode
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="e.g. 849201"
                      value={currentPasscode}
                      onChange={(e) => handlePasscodeChange(invite.id, e.target.value)}
                      disabled={isProcessing}
                      className="w-full text-center tracking-[0.3em] font-mono text-base font-bold rounded-xl border border-border bg-surface py-2 px-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Ask the workspace owner for their 6-digit security PIN to join.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDecline(invite)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-muted transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Decline
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(invite)}
                      disabled={isProcessing || currentPasscode.length !== 6}
                      className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary-hover transition cursor-pointer disabled:opacity-40"
                    >
                      <Check size={14} />
                      {isProcessing ? "Verifying..." : "Accept & Join"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
