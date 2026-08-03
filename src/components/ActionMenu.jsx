import React from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  HiDotsVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi";

export default function RowActionsMenu({ data, onView, onEdit, onDelete}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* 1. Trigger Button */}
      <MenuButton
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none cursor-pointer"
        aria-label="Toggle actions"
      >
        <HiDotsVertical size={18} />
      </MenuButton>

      {/* 2. Menu Items (Auto Z-index & Table Clipping Fix) */}
      <MenuItems
        transition
        anchor="bottom end"
        className="w-44 origin-top-right rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-2xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
      >
        <div className="py-0.5">
          {/* View Details */}
          {onView && (
            <MenuItem>
              <button
                onClick={() => onView(data)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 data-[focus]:bg-slate-50 dark:data-[focus]:bg-slate-700 cursor-pointer"
              >
                <HiOutlineEye size={18} />
                View Details
              </button>
            </MenuItem>
          )}

          {/* Edit Item */}
          {onEdit && (
            <MenuItem>
              <button
                onClick={() => onEdit(data)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 data-[focus]:bg-slate-50 dark:data-[focus]:bg-slate-700 cursor-pointer"
              >
                <HiOutlinePencil size={18} />
                Edit
              </button>
            </MenuItem>
          )}

          {/* Delete Item */}
          {onDelete && (
            <MenuItem>
              <button
                onClick={() => onDelete(data)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 data-[focus]:bg-rose-50 dark:data-[focus]:bg-rose-950/30 cursor-pointer"
              >
                <HiOutlineTrash size={18} />
                Delete
              </button>
            </MenuItem>
          )}
        </div>
      </MenuItems>
    </Menu>
  );
}
