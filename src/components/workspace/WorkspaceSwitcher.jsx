import React, { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import TeamModal from "./TeamModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import {
  HiChevronDown,
  HiCheck,
  HiPlus,
  HiUserGroup,
  HiBriefcase,
} from "react-icons/hi";

export default function WorkspaceSwitcher() {
  const {
    activeWorkspace,
    userWorkspaces,
    currentRole,
    switchWorkspace,
  } = useWorkspace();

  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!activeWorkspace) return null;

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-surface p-1.5 md:px-3 md:py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated hover:border-border focus:outline-none cursor-pointer">
          <div className="flex h-6 w-6 md:h-5 md:w-5 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-[11px] md:text-xs">
            {activeWorkspace.name ? activeWorkspace.name.charAt(0).toUpperCase() : <HiBriefcase size={12} />}
          </div>
          <span className="hidden md:inline-block max-w-[120px] lg:max-w-[160px] truncate">
            {activeWorkspace.name}
          </span>
          <span
            className={`hidden md:inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              currentRole === "owner"
                ? "bg-primary-muted text-primary"
                : "bg-success-muted text-success"
            }`}
          >
            {currentRole}
          </span>
          <HiChevronDown size={14} className="text-muted-foreground" />
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom start"
          className="w-56 origin-top-left rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-2xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Workspaces
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {userWorkspaces.map((ws) => {
              const isActive = ws.id === activeWorkspace.id;
              return (
                <MenuItem key={ws.id}>
                  <button
                    onClick={() => switchWorkspace(ws.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-primary-muted text-primary font-bold"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                        {ws.role || "member"}
                      </span>
                    </div>
                    {isActive && <HiCheck size={14} className="text-primary shrink-0" />}
                  </button>
                </MenuItem>
              );
            })}
          </div>

          <hr className="my-1.5 border-border" />

          {/* Manage Team Action */}
          <MenuItem>
            <button
              onClick={() => setIsTeamOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface transition cursor-pointer"
            >
              <HiUserGroup size={16} className="text-primary" />
              Manage Team & Invites
            </button>
          </MenuItem>

          {/* Create Workspace Action */}
          <MenuItem>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface transition cursor-pointer"
            >
              <HiPlus size={16} className="text-muted-foreground" />
              New Workspace
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>

      <TeamModal
        isOpen={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
      />

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}
