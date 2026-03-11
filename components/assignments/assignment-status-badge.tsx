import {
  AlertCircle,
  BookOpen,
  Clock3,
  Send,
  Star,
} from "lucide-react";

import type { AssignmentBadgeStatus } from "@/lib/api/assignments";
import { cn } from "@/lib/utils";

const ASSIGNMENT_STATUS_CONFIG: Record<
  AssignmentBadgeStatus,
  {
    label: string;
    className: string;
    iconClassName: string;
    icon: typeof Clock3;
  }
> = {
  pending: {
    label: "Pending",
    className: "border-[#ecd7a6] bg-[#fff5dc] text-[#8a6914]",
    iconClassName: "text-[#8a6914]",
    icon: Clock3,
  },
  submitted: {
    label: "Submitted",
    className: "border-[#cfe6f5] bg-[#eef7fd] text-[#356985]",
    iconClassName: "text-[#356985]",
    icon: Send,
  },
  late: {
    label: "Late",
    className: "border-[#f2d9c4] bg-[#fff4ea] text-[#c46a1b]",
    iconClassName: "text-[#c46a1b]",
    icon: AlertCircle,
  },
  graded: {
    label: "Graded",
    className: "border-[#d9ead0] bg-[#f6fbf2] text-[#2d8c53]",
    iconClassName: "text-[#2d8c53]",
    icon: Star,
  },
  overdue: {
    label: "Missing",
    className: "border-[#f2d5d1] bg-[#fff5f3] text-[#bf4d42]",
    iconClassName: "text-[#bf4d42]",
    icon: AlertCircle,
  },
  material: {
    label: "Material",
    className: "border-[#d7dff2] bg-[#eff4ff] text-[#4b61aa]",
    iconClassName: "text-[#4b61aa]",
    icon: BookOpen,
  },
};

export function AssignmentStatusBadge({
  status,
  size = "default",
}: {
  status: AssignmentBadgeStatus;
  size?: "default" | "sm";
}) {
  const config = ASSIGNMENT_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold uppercase tracking-[0.14em]",
        size === "sm" ? "text-[9px]" : "text-[10px]",
        config.className,
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", config.iconClassName)} />
      {config.label}
    </span>
  );
}

export { ASSIGNMENT_STATUS_CONFIG };
