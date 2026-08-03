import React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { HiChevronDown } from "react-icons/hi";

export default function CustomDropdown({
  value,
  onChange,
  readOnly = false,
  options = [],
  labelPrefix = "", // Prefix optional default
  align = "left",
  placeholder = "Select option",
  className = "",
}) {
  const selectedOption = options.find((opt) => opt.value === value);
  const rawLabel = selectedOption ? selectedOption.label : value || placeholder;

  // Clean prefix formatting
  const displayLabel = labelPrefix ? `${labelPrefix}: ${rawLabel}` : rawLabel;

  const anchorPosition = align === "right" ? "bottom end" : "bottom start";

  return (
    <Listbox value={value} onChange={onChange} disabled={readOnly}>
      {({ open }) => (
        <div className={`relative inline-block text-left ${className}`}>
          {/* Trigger Button */}
          <ListboxButton
            className={`flex items-center justify-between gap-2 rounded-full border bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all select-none
              ${
                readOnly
                  ? "opacity-60 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              }
              ${
                open
                  ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10"
                  : "border-slate-200 dark:border-slate-700"
              }`}
          >
            <span className="capitalize">{displayLabel}</span>
            <HiChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </ListboxButton>

          {/* Options Menu */}
          <ListboxOptions
            transition
            anchor={anchorPosition}
            className="w-52 origin-top rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl transition duration-150 ease-out [--anchor-gap:8px] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 z-50 max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors capitalize text-left cursor-pointer text-slate-600 dark:text-slate-300 data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-700/60 data-[selected]:bg-indigo-50 dark:data-[selected]:bg-indigo-950/40 data-[selected]:text-indigo-600 dark:data-[selected]:text-indigo-400"
              >
                {option.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      )}
    </Listbox>
  );
}
