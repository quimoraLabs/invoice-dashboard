import React from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";

export default function RowActionsMenu({ data, onView, onEdit, onDelete}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* 1. Trigger Button */}
      <MenuButton
        className="rounded-xl border border-border bg-surface-elevated p-2 text-muted-foreground transition-colors hover:bg-surface focus:outline-none cursor-pointer"
        aria-label="Toggle actions"
      >
        <MoreVertical size={18} />
      </MenuButton>

      {/* 2. Menu Items (Auto Z-index & Table Clipping Fix) */}
      <MenuItems
        transition
        anchor="bottom end"
        className="w-44 origin-top-right rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-2xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50"
      >
        <div className="py-0.5">
          {/* View Details */}
          {onView && (
            <MenuItem>
              <button
                onClick={() => onView(data)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground data-focus:bg-surface cursor-pointer"
              >
                <Eye size={18} />
                View Details
              </button>
            </MenuItem>
          )}

          {/* Edit Item */}
          {onEdit && (
            <MenuItem>
              <button
                onClick={() => onEdit(data)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground data-focus:bg-surface cursor-pointer"
              >
                <Pencil size={18} />
                Edit
              </button>
            </MenuItem>
          )}

          {/* Delete Item */}
          {onDelete && (
            <MenuItem>
              <button
                onClick={() => onDelete(data)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-danger data-focus:bg-danger-muted/30 cursor-pointer"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </MenuItem>
          )}
        </div>
      </MenuItems>
    </Menu>
  );
}
