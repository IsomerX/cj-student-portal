"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronDown, Clock, Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  icon?: React.ReactNode;
}

interface SearchableComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  recentOptions?: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  initialMessage?: string;
  recentLabel?: string;
  minSearchLength?: number;
}

function getAvatarFallback(option: ComboboxOption) {
  if (option.avatarFallback?.trim()) return option.avatarFallback.trim().slice(0, 2).toUpperCase();

  const [first = "", second = ""] = option.label.trim().split(/\s+/);
  return `${first[0] ?? ""}${second[0] ?? first[1] ?? ""}`.toUpperCase() || "ST";
}

function OptionAvatar({ option }: { option: ComboboxOption }) {
  if (option.avatarUrl) {
    return (
      <Image
        src={option.avatarUrl}
        alt={option.label}
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover"
        unoptimized
      />
    );
  }

  if (option.icon) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {option.icon}
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#283618] text-xs font-bold text-white shadow-sm">
      {getAvatarFallback(option)}
    </div>
  );
}

function OptionRow({
  option,
  onSelect,
}: {
  option: ComboboxOption;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
    >
      <OptionAvatar option={option} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{option.label}</p>
        {option.description ? (
          <p className="truncate text-xs text-gray-500">{option.description}</p>
        ) : null}
      </div>
    </button>
  );
}

export function SearchableCombobox({
  value,
  onChange,
  options,
  recentOptions = [],
  placeholder = "Search for an option...",
  searchPlaceholder,
  className,
  disabled = false,
  loading = false,
  emptyMessage = "No results found.",
  initialMessage = "Type at least 2 characters to search",
  recentLabel = "Recently Viewed",
  minSearchLength = 2,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const allOptions = React.useMemo(() => {
    const map = new Map<string, ComboboxOption>();

    for (const option of [...recentOptions, ...options]) {
      map.set(option.value, option);
    }

    return Array.from(map.values());
  }, [options, recentOptions]);

  const selectedOption =
    value === null ? null : allOptions.find((option) => option.value === value) ?? null;

  const showSearchResults = searchQuery.trim().length >= minSearchLength;
  const filteredOptions = React.useMemo(() => {
    if (!showSearchResults) return [];

    const query = searchQuery.trim().toLowerCase();
    return options.filter((option) =>
      [option.label, option.description, option.searchText]
        .filter(Boolean)
        .some((part) => part?.toLowerCase().includes(query)),
    );
  }, [options, searchQuery, showSearchResults]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);

      if (!inContainer && !inDropdown) {
        setIsOpen(false);
      }
    }

    if (!isOpen) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && !selectedOption) {
      inputRef.current?.focus();
    }
  }, [isOpen, selectedOption]);

  const updatePosition = React.useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;

    setDropdownStyle(
      openAbove
        ? {
            bottom: `${window.innerHeight - rect.top + 8}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
          }
        : {
            top: `${rect.bottom + 8}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
          },
    );
  }, []);

  React.useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      if (dropdownRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onChange(null);
    setSearchQuery("");
    setIsOpen(false);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleClearQuery = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed z-[99999] max-h-[320px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      style={dropdownStyle}
    >
      {showSearchResults ? (
        loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : filteredOptions.length > 0 ? (
          <div className="max-h-[320px] overflow-y-auto py-1">
            {filteredOptions.map((option) => (
              <OptionRow
                key={option.value}
                option={option}
                onSelect={() => handleSelect(option)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">{emptyMessage}</div>
        )
      ) : recentOptions.length > 0 ? (
        <div className="max-h-[320px] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {recentLabel}
            </span>
          </div>
          <div className="py-1">
            {recentOptions.map((option) => (
              <OptionRow
                key={option.value}
                option={option}
                onSelect={() => handleSelect(option)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-500">
          <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p>{initialMessage}</p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex cursor-text items-center gap-2 rounded-xl border px-3 py-2.5 transition-all",
          disabled ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60" : "",
          isOpen ? "border-[#283618] ring-2 ring-[#283618]/20" : "border-gray-200 hover:border-gray-300",
        )}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          if (!selectedOption) {
            inputRef.current?.focus();
          }
        }}
      >
        {selectedOption ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <OptionAvatar option={selectedOption} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#283618]">
                {selectedOption.label}
              </p>
              {selectedOption.description ? (
                <p className="truncate text-xs text-gray-500">{selectedOption.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleClearSelection();
              }}
              className="rounded-full p-1 transition-colors hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <>
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={searchPlaceholder || placeholder}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleClearQuery();
                }}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            ) : null}
          </>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
            isOpen ? "rotate-180" : "",
          )}
        />
      </div>

      {typeof document !== "undefined" && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}
    </div>
  );
}
