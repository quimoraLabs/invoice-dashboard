import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import TeamModal from "../components/workspace/TeamModal";
import CreateWorkspaceModal from "../components/workspace/CreateWorkspaceModal";
import WorkspaceSettingsModal from "../components/workspace/WorkspaceSettingsModal";
import {
  SlidersHorizontal,
  ChevronDown,
  Building2,
  ClipboardList,
  UserPlus,
  KeyRound,
  Plus,
  Check,
  Briefcase,
  ShieldCheck,
  Lock,
} from "lucide-react";

export default function ConfigureDropdown() {
  const location = useLocation();
  const {
    activeWorkspace,
    userWorkspaces,
    currentRole,
    switchWorkspace,
  } = useWorkspace();

  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Check if an operational route within this menu is currently active
  const isAuditActive = location.pathname === "/activity-log";
  const isProfileActive = location.pathname === "/business-profile";
  const isConfigureActive = isAuditActive || isProfileActive;

  if (!activeWorkspace) return null;

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton
          aria-label="Workspace & Configuration Menu"
          className={`group flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-hidden cursor-pointer ${
            isConfigureActive
              ? "border-primary/40 bg-primary/10 text-primary shadow-xs"
              : "border-border bg-surface-elevated text-foreground hover:bg-surface hover:border-border-hover"
          }`}
        >
          <SlidersHorizontal
            size={14}
            className={`transition ${
              isConfigureActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            }`}
          />
          <span className="hidden sm:inline-block">Configure</span>
          {isConfigureActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          )}
          <ChevronDown
            size={13}
            className="text-muted-foreground transition group-hover:text-foreground"
          />
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom end"
          className="w-72 origin-top-right rounded-2xl border border-border bg-surface-elevated p-2 shadow-2xl transition duration-150 ease-out [--anchor-gap:8px] focus:outline-hidden data-closed:scale-95 data-closed:opacity-0 z-50 divide-y divide-border"
        >
          {/* Section 1: Active Workspace Summary & Switcher */}
          <div className="pb-2">
            <div className="px-3 pt-1 pb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Active Workspace</span>
              {currentRole && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    currentRole === "owner"
                      ? "bg-primary/15 text-primary"
                      : "bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  <ShieldCheck size={10} />
                  {currentRole}
                </span>
              )}
            </div>

            {/* Current Active Workspace Card */}
            <div className="mx-1 my-1 flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2 border border-border/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                {activeWorkspace.name ? (
                  activeWorkspace.name.charAt(0).toUpperCase()
                ) : (
                  <Briefcase size={14} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                  {activeWorkspace.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  6-digit PIN Protected
                </p>
              </div>
            </div>

            {/* Switch to Other Workspaces (if any) */}
            {userWorkspaces?.length > 1 && (
              <div className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto px-1">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  Switch Workspace
                </div>
                {userWorkspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspace.id;
                  if (isActive) return null; // Already shown above
                  return (
                    <MenuItem key={ws.id}>
                      <button
                        onClick={() => switchWorkspace(ws.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-surface transition cursor-pointer"
                      >
                        <span className="truncate">{ws.name}</span>
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                          {ws.role || "member"}
                        </span>
                      </button>
                    </MenuItem>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Management & Administrative Navigation */}
          <div className="py-1.5 space-y-0.5">
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Operations
            </div>

            {/* Team & Invites */}
            <MenuItem>
              <button
                onClick={() => setIsTeamOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-surface hover:text-foreground transition cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus size={14} />
                </div>
                <span>Team & Invites</span>
              </button>
            </MenuItem>

            {/* Business Profile */}
            <MenuItem>
              <Link
                to="/business-profile"
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isProfileActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-foreground hover:bg-surface"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                    isProfileActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  <Building2 size={14} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Business Profile</span>
                  {isProfileActive && <Check size={14} />}
                </div>
              </Link>
            </MenuItem>

            {/* Workspace Audit Log */}
            <MenuItem>
              <Link
                to="/activity-log"
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isAuditActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-foreground hover:bg-surface"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                    isAuditActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  <ClipboardList size={14} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Workspace Audit Log</span>
                  {isAuditActive && <Check size={14} />}
                </div>
              </Link>
            </MenuItem>
          </div>

          {/* Section 3: Workspace Settings & Creation */}
          <div className="pt-1.5 space-y-0.5">
            <MenuItem>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface border border-border text-muted-foreground">
                  <KeyRound size={13} />
                </div>
                <span>Workspace Settings & PIN</span>
              </button>
            </MenuItem>

            <MenuItem>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface border border-border text-muted-foreground">
                  <Plus size={14} />
                </div>
                <span>New Workspace</span>
              </button>
            </MenuItem>

            <MenuItem>
              <button
                onClick={() => window.dispatchEvent(new Event("invomora_lock_screen"))}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface border border-border text-muted-foreground">
                  <Lock size={13} />
                </div>
                <span>Lock Dashboard</span>
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      {/* Modals */}
      <TeamModal
        isOpen={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
      />

      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}
