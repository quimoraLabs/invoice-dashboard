import React, { useState, useEffect, useRef } from "react";
import {
  HiDotsVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi";

export default function RowActionsMenu({ product, onEdit, onDelete, onView }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
        aria-label="Toggle actions"
      >
        <HiDotsVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="py-0.5">
            <button
              onClick={() => { setIsOpen(false); onView(product); }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <HiOutlineEye size={18} />
              View Details
            </button>
            <button
              onClick={() => { setIsOpen(false); onEdit(product); }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <HiOutlinePencil size={18} />
              Edit Product
            </button>
            <button
              onClick={() => { setIsOpen(false); onDelete(product); }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <HiOutlineTrash size={18} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}