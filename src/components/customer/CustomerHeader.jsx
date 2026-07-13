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
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-3 text-white shadow-md shadow-indigo-100 dark:shadow-none transition-all hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <HiPlus size={16} />
      </button>
    </div>
  );
}