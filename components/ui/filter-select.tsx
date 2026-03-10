"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

interface FilterSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  variant?: "default" | "minimal" | "form";
  disabled?: boolean;
  openDirection?: "down" | "up" | "auto";
  maxDropdownHeight?: string;
  multiSelect?: boolean;
  clearable?: boolean;
  clearValue?: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  containerClassName,
  icon,
  isOpen,
  onToggle,
  onClose,
  variant = "default",
  disabled = false,
  openDirection = "auto",
  maxDropdownHeight,
  multiSelect = false,
  clearable = true,
  clearValue = "",
}: FilterSelectProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) {
        onClose();
      }
    }

    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const updatePosition = React.useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 300;
    const dropdownWidth = Math.max(rect.width, 200);
    const viewportWidth = window.innerWidth;
    const padding = 16;

    const wouldOverflowRight = rect.left + dropdownWidth > viewportWidth - padding;
    const horizontalPosition = wouldOverflowRight
      ? { right: `${viewportWidth - rect.right}px` }
      : { left: `${rect.left}px` };

    if (openDirection === "down") {
      setDropdownStyle({
        top: `${rect.bottom + 8}px`,
        ...horizontalPosition,
        minWidth: `${rect.width}px`,
      });
      return;
    }

    if (openDirection === "up" || (spaceBelow < dropdownHeight && spaceAbove > spaceBelow)) {
      setDropdownStyle({
        top: `${rect.top - 8}px`,
        ...horizontalPosition,
        minWidth: `${rect.width}px`,
        transform: "translateY(-100%)",
      });
      return;
    }

    setDropdownStyle({
      top: `${rect.bottom + 8}px`,
      ...horizontalPosition,
      minWidth: `${rect.width}px`,
    });
  }, [openDirection]);

  React.useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      if (dropdownRef.current?.contains(event.target as Node)) return;
      onClose();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, onClose]);

  const selectedValues =
    multiSelect && value ? value.split(",").filter(Boolean) : [];
  const selectedOption = options.find((option) => option.value === value);
  const allOption = multiSelect ? options.find((option) => option.value === "") : null;

  const displayValue = multiSelect
    ? selectedValues.length === 0
      ? allOption?.label || placeholder
      : selectedValues.length === 1
        ? options.find((option) => option.value === selectedValues[0])?.label ||
          selectedValues[0]
        : `${selectedValues.length} selected`
    : selectedOption
      ? selectedOption.label
      : value || placeholder;

  const isSelected = multiSelect
    ? selectedValues.length > 0
    : Boolean(value && value !== clearValue && value !== "Any" && value !== "All Classes");
  const canClear = clearable && !disabled && isSelected;

  return (
    <div className={cn("relative", containerClassName)} ref={containerRef}>
      <Button
        type="button"
        onClick={disabled ? undefined : onToggle}
        variant="outline"
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={cn(
          "justify-between gap-1 font-medium duration-200",
          disabled ? "pointer-events-none opacity-50" : "",
          variant === "form"
            ? "border-gray-200 bg-white px-3 text-gray-900 hover:bg-gray-50 focus:border-transparent focus:ring-2 focus:ring-[#283618]"
            : isOpen || (variant !== "minimal" && isSelected)
              ? variant === "default"
                ? "border-[#283618] bg-[#283618]/5 text-[#283618] ring-2 ring-[#283618]/10 hover:border-[#283618] hover:bg-[#283618]/10"
                : "border-[#283618] text-[#283618] ring-2 ring-[#283618]/10 hover:bg-[#283618]/5"
              : "",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
          {icon}
          {label ? <span className="opacity-75">{label}</span> : null}
          <span className="truncate">
            {!label && !icon ? displayValue : displayValue.replace(label || "", "")}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {canClear ? (
            <span
              role="button"
              aria-label="Clear selection"
              className="rounded p-0.5 hover:bg-gray-100"
              onClick={(event) => {
                event.stopPropagation();
                onChange(clearValue);
                onClose();
              }}
            >
              <X className="h-3.5 w-3.5 text-[#737373]" />
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform",
              isOpen ? "rotate-180" : "",
            )}
          />
        </span>
      </Button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[99999] w-max max-h-[300px] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100"
              style={dropdownStyle}
            >
              <div className="p-1" style={maxDropdownHeight ? { maxHeight: maxDropdownHeight } : undefined}>
                {options.map((option) => {
                  const isChecked = multiSelect
                    ? selectedValues.includes(option.value)
                    : value === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (multiSelect) {
                          if (option.value === "") {
                            onChange("");
                            onClose();
                            return;
                          }

                          const newValues = isChecked
                            ? selectedValues.filter((selectedValue) => selectedValue !== option.value)
                            : [...selectedValues, option.value];
                          onChange(newValues.join(","));
                          return;
                        }

                        onChange(option.value);
                        onClose();
                      }}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isChecked
                          ? "bg-[#283618]/5 font-medium text-[#283618]"
                          : "text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <div className="flex flex-1 flex-col">
                        <span>{option.label}</span>
                        {option.subLabel ? (
                          <span className="text-xs text-gray-400">{option.subLabel}</span>
                        ) : null}
                      </div>
                      {option.icon ? <span className="text-gray-400">{option.icon}</span> : null}
                      {isChecked ? <Check className="h-3.5 w-3.5 text-[#283618]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
