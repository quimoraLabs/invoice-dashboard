import React from "react";
import { HiPlus } from "react-icons/hi";

export default function DashboardHeader({ onAddClick }) {
  return (
    <div className="mb-6 flex gap-4 items-center justify-between">
      <h1 className="mt-2 text-2xl font-semibold text-foreground">
        Customer records
      </h1>
      <button
        onClick={onAddClick}
        className="inline-flex items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <HiPlus size={16} />
      </button>
    </div>
  );
}