import React, { useState, useEffect, useRef } from "react";
import { HiChevronDown } from "react-icons/hi";

export default function CustomDropdown({ 
  labelPrefix = "", 
  value, 
  onChange, 
  options = [], 
  align = "left" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle clicks outside the component to close the dropdown menu
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

  // Determine dynamic menu alignment styles
  const alignmentClasses = align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full border bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 select-none ${
          isOpen 
            ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10" 
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <span className="capitalize">
          {labelPrefix ? `${labelPrefix} ` : ""}{displayLabel}
        </span>
        <HiChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Floating Menu List */}
      {isOpen && (
        <div className={`absolute z-30 mt-2 w-52 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150 ${alignmentClasses}`}>
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
                  className={`flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors capitalize text-left cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
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