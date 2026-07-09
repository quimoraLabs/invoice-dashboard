import React, { useState, useRef, useEffect } from "react";
import { HiSearch, HiChevronDown, HiX } from "react-icons/hi";

// Custom Menu Component with fixed hover detection
function CustomDropdown({ labelPrefix = "", value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full border bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          isOpen ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <span className="capitalize">
          {labelPrefix} {displayLabel}
        </span>
        <HiChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Floating Menu Grid */}
      {isOpen && (
        <div className="absolute left-0 z-30 mt-2 w-52 origin-top-left rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="py-0.5 max-h-60 overflow-y-auto space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  //  Bug Fix 1: Added distinct background and text color changes on hover to trace selection tracking 
                  className={`flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors capitalize text-left cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-700/60"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ControlBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categories,
  sortOrder,
  setSortOrder,
}) {
  
  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: cat === "all" ? "All Categories" : cat,
  }));

  const sortOptions = [
    { value: "name-asc", label: "Name: A-Z" },
    { value: "name-desc", label: "Name: Z-A" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  // Bug Fix 2 & 3: Master condition to see if any user mutations have altered state defaults
  const isFiltered = searchQuery !== "" || categoryFilter !== "all" || sortOrder !== "name-asc";

  const handleResetAll = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortOrder("name-asc");
  };

  return (
    <div className="mb-8 grid grid-cols-1 md:flex md:items-center gap-4">
      {/* Search Bar Wrapper Container */}
      <div className="relative flex-grow md:max-w-md">
        <HiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-11 pr-10 text-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
        />
        
        {/* Bug Fix 4: Smooth interactive absolute click action clear mechanism on string data triggers */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <HiX size={16} />
          </button>
        )}
      </div>

      {/* Filters Group */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category Selection Dropdown */}
        <CustomDropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
        />

        {/* Sorting Execution Dropdown */}
        <CustomDropdown
          labelPrefix="Sort:"
          value={sortOrder}
          onChange={setSortOrder}
          options={sortOptions}
        />

        {/* Bug Fix 2 & 3: Master Reset Action Pill UI Component injection */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleResetAll}
            className="text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors px-2 py-1.5 focus:outline-none"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}