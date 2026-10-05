import React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({
  value,
  onChange,
  readOnly = false,
  options = [],
  labelPrefix = "",
  align = "left",
  placeholder = "Select option",
  className = "",
}) {
  const selectedOption = options.find((opt) => opt.value === value);
  const rawLabel = selectedOption ? selectedOption.label : value || placeholder;

  const displayLabel = labelPrefix ? `${labelPrefix}: ${rawLabel}` : rawLabel;

  const anchorPosition = align === "right" ? "bottom end" : "bottom start";

  return (
    <Listbox value={value} onChange={onChange} disabled={readOnly}>
      {({ open }) => (
        <div className={`relative inline-block text-left ${className}`}>
          {/* Trigger Button */}
          <ListboxButton
            className={`flex items-center justify-between gap-2 rounded-full border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all select-none
              ${
                readOnly
                  ? "opacity-60 bg-surface border-border"
                  : "hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/20"
              }
              ${open ? "border-primary ring-2 ring-ring/10" : "border-border"}`}
          >
            <span className="capitalize">{displayLabel}</span>
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </ListboxButton>

          {/* Options Menu */}
          <ListboxOptions
            transition
            anchor={anchorPosition}
            className="w-52 origin-top rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-xl transition duration-150 ease-out [--anchor-gap:8px] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50 max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors capitalize text-left cursor-pointer text-muted-foreground data-focus:bg-surface data-selected:bg-muted data-selected:text-primary"
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
