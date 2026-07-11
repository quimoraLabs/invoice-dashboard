import React from "react";
import { HiSearch } from "react-icons/hi";
import CustomDropdown from "../CustomDropdown";

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
}) {
  // Define standard configuration for sorting options
  const sortOptions = [
    { value: "name-asc", label: "Name (A - Z)" },
    { value: "name-desc", label: "Name (Z - A)" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
  ];
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1">
        <HiSearch
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customers by name, email, or phone"
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {/* Interactive Sorting Dropdown */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <CustomDropdown
          labelPrefix="Sort by:"
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
          align="right"
        />
      </div>
    </div>
  );
}
