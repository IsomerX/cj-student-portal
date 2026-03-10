"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type FilterPillTone = "neutral" | "brand" | "success" | "warning" | "danger";
type FilterPillShape = "pill" | "tag";

interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: FilterPillTone;
  shape?: FilterPillShape;
  selected?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const selectedToneClasses: Record<FilterPillTone, string> = {
  neutral: "border-gray-200 bg-gray-100 text-gray-700",
  brand: "border-[#283618]/15 bg-[#283618]/5 text-[#283618]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function FilterPill({
  className,
  tone = "brand",
  shape = "pill",
  selected = false,
  dismissible = false,
  onDismiss,
  icon,
  children,
  disabled,
  ...props
}: FilterPillProps) {
  const isInteractive = Boolean(props.onClick || onDismiss) && !disabled;

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 border text-[10px] font-bold uppercase tracking-wide transition-colors",
        shape === "pill" ? "rounded-full px-3 py-1" : "rounded-md px-2 py-1",
        selected
          ? selectedToneClasses[tone]
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
        isInteractive ? "cursor-pointer" : "cursor-default",
        disabled ? "opacity-50" : "",
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
      {dismissible ? (
        <span
          role="button"
          aria-label="Remove filter"
          className="rounded-full p-0.5 transition-colors hover:bg-black/5"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss?.();
          }}
        >
          <X className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  );
}
