"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RowActionVariant = "ghost" | "flat" | "outline";

export interface RowAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: RowActionVariant;
  disabled?: boolean;
  className?: string;
}

interface RowActionsProps {
  actions: RowAction[];
  className?: string;
}

const variantClasses: Record<RowActionVariant, string> = {
  ghost: "text-gray-400 hover:bg-transparent hover:text-[#283618] shadow-none",
  flat: "border border-gray-200 text-gray-400 hover:border-[#283618] hover:text-[#283618] shadow-none",
  outline: "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-[#283618] shadow-none",
};

export function RowActions({ actions, className }: RowActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {actions.map((action) => {
        const variant = action.variant ?? "ghost";

        return (
          <Button
            key={action.id}
            type="button"
            variant={variant}
            size="icon"
            disabled={action.disabled}
            title={action.label}
            aria-label={action.label}
            className={cn("h-9 w-9", variantClasses[variant], action.className)}
            onClick={action.onClick}
          >
            {action.icon}
          </Button>
        );
      })}
    </div>
  );
}
