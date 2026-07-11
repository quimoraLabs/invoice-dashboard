import React from "react";
import { HiPlus } from "react-icons/hi";

export default function DashboardHeader({ onAddClick }) {
  return (
    <div className="mb-6 flex gap-4 items-center justify-between">
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Customer records
      </h1>
      <button
        onClick={onAddClick}
        className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 flex items-center justify-center gap-2"
      >
        <HiPlus size={16} />
        Add customer
      </button>
    </div>
  );
}