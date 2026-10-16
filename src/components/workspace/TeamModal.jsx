import React, { useState } from "react";
import { useAuth } from "../../contexts/authContext/useAuth";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useSession } from "@clerk/react";
import toast from "react-hot-toast";
import {
  X,
  UserPlus,
  Trash2,
  Mail,
  Users,
  Key,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import CustomDropdown from "../CustomDropdown";

const roleOptions = [
  { value: "accountant", label: "Accountant" },
  { value: "owner", label: "Co-Owner" },
];

export default function TeamModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { session } = useSession();
  const {
    activeWorkspace,
    members,
    pendingInvites,
    isOwner,
    inviteMember,
    revokeInvite,
    removeMember,
  } = useWorkspace();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("accountant");
  const [authPasscode, setAuthPasscode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address.");
      return;
    }

    // Double Security: Authorize invite with 6-digit owner passcode
    if (activeWorkspace?.invitePasscode) {
      const enteredCode = authPasscode.trim();
      if (!enteredCode || enteredCode !== String(activeWorkspace.invitePasscode).trim()) {
        try {
          const clerkToken = await session?.getToken().catch(() => null);
          if (clerkToken) {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clerkToken,
                type: "security_alert",
                workspaceId: activeWorkspace.id,
                details: `Failed authorization PIN attempt when attempting to invite ${inviteEmail}`,
                actorInfo: currentUser?.email || "Local Session",
              }),
            });
          }
        } catch {
          // ignore error
        }

        toast.error("Security Alert: Incorrect Owner PIN! Unauthorized invite blocked.");
        return;
      }
    }

    setIsSending(true);
    try {
      await inviteMember(inviteEmail, inviteRole);

      // Dispatch professional invitation email with passcode to invitee
      try {
        const clerkToken = await session?.getToken().catch(() => null);
        if (clerkToken) {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerkToken,
              type: "workspace_invite",
              workspaceId: activeWorkspace.id,
              toEmail: inviteEmail.trim(),
              role: inviteRole,
              inviterName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Workspace Owner",
            }),
          });
        }
      } catch (emailErr) {
        console.warn("Could not dispatch invitation email:", emailErr.message);
      }

      toast.success(`Invitation & Security PIN sent to ${inviteEmail}!`);
      setInviteEmail("");
      setAuthPasscode("");
    } catch (err) {
      console.error("Invite error:", err);
      toast.error(err?.message || "Failed to send invitation.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      await revokeInvite(inviteId);
      toast.success("Invitation revoked.");
    } catch (err) {
      toast.error(err?.message || "Failed to revoke invite.");
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (memberUserId === currentUser?.uid || memberUserId === currentUser?.id) {
      toast.error("You cannot remove yourself from the workspace.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this team member?")) return;

    try {
      await removeMember(memberUserId);
      toast.success("Member removed from workspace.");
    } catch (err) {
      toast.error(err?.message || "Failed to remove member.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface-elevated border border-border shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Team & Collaborators
              </h3>
              <p className="text-xs text-muted-foreground">
                {activeWorkspace?.name || "Workspace"} • {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Invite Section (Only visible to Owners) */}
          {isOwner ? (
            <div className="rounded-xl border border-primary/20 bg-primary-muted/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="text-primary" size={18} />
                <h4 className="text-sm font-semibold text-foreground">
                  Invite Team Member
                </h4>
              </div>
              <form onSubmit={handleSendInvite} className="flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <CustomDropdown
                    value={inviteRole}
                    onChange={(val) => setInviteRole(val)}
                    options={roleOptions}
                    className="shrink-0"
                    buttonClassName="!rounded-xl !py-2"
                  />
                </div>

                {/* Double Security: Owner PIN Required to dispatch invite */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="relative flex-1 w-full">
                    <Key className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="Enter Owner PIN (6 digits) to authorize"
                      value={authPasscode}
                      onChange={(e) => setAuthPasscode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs tracking-wider font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50 transition shrink-0 cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    {isSending ? "Authorizing..." : "Authorize & Send"}
                  </button>
                </div>
              </form>

              {activeWorkspace?.invitePasscode && (
                <div className="mt-3 pt-3 border-t border-primary/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Key className="text-primary" size={15} />
                    <span>Invite Passcode:</span>
                    <span className="font-mono font-bold tracking-widest bg-surface px-2 py-0.5 rounded-md border border-border">
                      {activeWorkspace.invitePasscode}
                    </span>
                    <span className="text-muted-foreground text-[11px]">(Required for invitee to join)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeWorkspace.invitePasscode);
                      setCopiedPasscode(true);
                      toast.success("Passcode copied!");
                      setTimeout(() => setCopiedPasscode(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {copiedPasscode ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    {copiedPasscode ? "Copied" : "Copy Passcode"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span> You have Accountant access. Only workspace Owners can invite or remove team members.
            </div>
          )}

          {/* Members List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Active Members
            </h4>
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrentUser =
                  member.userId === currentUser?.uid || member.userId === currentUser?.id;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 hover:border-border transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated border border-border text-sm font-bold text-foreground">
                        {member.displayName?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {member.displayName || "Team Member"}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          member.role === "owner"
                            ? "bg-primary-muted text-primary border border-primary/20"
                            : "bg-success-muted text-success border border-success/20"
                        }`}
                      >
                        {member.role || "Member"}
                      </span>

                      {isOwner && !isCurrentUser && member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Remove Member"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-muted hover:text-danger transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invites (if any) */}
          {pendingInvites.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Pending Invitations ({pendingInvites.length})
              </h4>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-xl border border-dashed border-border bg-surface p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {invite.invitedEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Role: <span className="capitalize font-semibold text-foreground">{invite.role}</span> • Invited
                      </p>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-muted transition"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-border px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
