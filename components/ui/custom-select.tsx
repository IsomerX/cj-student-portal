"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  searchable?: boolean;
  variant?: "default" | "minimal";
  clearValue?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  error,
  searchable = false,
  variant = "default",
  clearValue = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const canClearSelection = !disabled && value !== clearValue;

  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedTrigger && !clickedDropdown) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownMaxHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownMaxHeight && rect.top > spaceBelow;

      setDropdownStyle(
        openAbove
          ? {
              bottom: `${window.innerHeight - rect.top + 4}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
            }
          : {
              top: `${rect.bottom + 4}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
            },
      );
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const buttonStyles =
    variant === "minimal"
      ? "w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm font-medium text-[#283618] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#283618]"
      : "w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#283618] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#283618]";

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed z-[99999] max-h-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100"
      style={dropdownStyle}
    >
      {searchable ? (
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm focus:border-[#283618] focus:outline-none focus:ring-1 focus:ring-[#283618]"
              onClick={(event) => event.stopPropagation()}
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSearchTerm("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto p-1">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                option.value === value
                  ? "bg-[#283618]/5 font-medium text-[#283618]"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#283618]" />
              ) : null}
            </button>
          ))
        ) : (
          <div className="px-4 py-3 text-center text-sm text-gray-400">
            No results found
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen((current) => !current)}
        disabled={disabled}
        className={cn(
          "inline-flex",
          buttonStyles,
          disabled ? "cursor-not-allowed opacity-50" : "",
          error ? "ring-1 ring-red-500" : "",
        )}
      >
        <span className={cn("flex items-center gap-2 truncate", selectedOption ? "text-[#283618]" : "text-[#737373]")}>
          {selectedOption?.icon ? <selectedOption.icon className="h-4 w-4 flex-shrink-0" /> : null}
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        <span className="flex flex-shrink-0 items-center gap-1">
          {canClearSelection ? (
            <span
              role="button"
                className="rounded p-0.5 hover:bg-gray-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(clearValue);
                  setIsOpen(false);
                }}
              >
              <X className="h-3.5 w-3.5 text-[#737373]" />
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#737373] transition-transform",
              isOpen ? "rotate-180" : "",
            )}
          />
        </span>
      </button>
      {typeof document !== "undefined" && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}
    </div>
  );
}
