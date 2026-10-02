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
        <MenuButton className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-300 focus:outline-none cursor-pointer">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <HiBriefcase size={12} />
          </div>
          <span className="max-w-30 sm:max-w-40 truncate">
            {activeWorkspace.name}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              currentRole === "owner"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {currentRole}
          </span>
          <HiChevronDown size={14} className="text-slate-400" />
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom start"
          className="w-56 origin-top-left rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                        {ws.role || "member"}
                      </span>
                    </div>
                    {isActive && <HiCheck size={14} className="text-indigo-600 shrink-0" />}
                  </button>
                </MenuItem>
              );
            })}
          </div>

          <hr className="my-1.5 border-slate-100" />

          {/* Manage Team Action */}
          <MenuItem>
            <button
              onClick={() => setIsTeamOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <HiUserGroup size={16} className="text-indigo-600" />
              Manage Team & Invites
            </button>
          </MenuItem>

          {/* Create Workspace Action */}
          <MenuItem>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <HiPlus size={16} className="text-slate-500" />
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
