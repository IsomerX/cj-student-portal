import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  User,
} from "lucide-react";

import { AssignmentStatusBadge } from "@/components/assignments/assignment-status-badge";
import type {
  AssignmentBadgeStatus,
  StudentAssignment,
} from "@/lib/api/assignments";
import { cn } from "@/lib/utils";

export type AssignmentListViewMode = "assigned" | "missing" | "done";

const MATERIAL_TYPES = new Set(["material", "presentation", "lab_work", "other"]);

const SUBJECT_COLOR_PALETTE = [
  { background: "bg-[#f6ede4]", text: "text-[#8e5c2f]" },
  { background: "bg-[#eef4ff]", text: "text-[#395189]" },
  { background: "bg-[#eef7e6]", text: "text-[#44611f]" },
  { background: "bg-[#fff3e1]", text: "text-[#9a6a12]" },
  { background: "bg-[#f8eefc]", text: "text-[#7f4f9e]" },
  { background: "bg-[#f9ecec]", text: "text-[#975d5d]" },
];

function getSubjectColor(subject: string) {
  const hash = [...subject].reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
  return SUBJECT_COLOR_PALETTE[hash % SUBJECT_COLOR_PALETTE.length];
}

function formatShortDate(date?: string | null) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getDisplayStatus(assignment: StudentAssignment): AssignmentBadgeStatus {
  return MATERIAL_TYPES.has(assignment.type) ? "material" : assignment.status;
}

function getDaysLabel(assignment: StudentAssignment) {
  if (assignment.status === "pending") {
    if (assignment.daysRemaining === 0) return "Due today";
    if (assignment.daysRemaining === 1) return "Due tomorrow";
    if (assignment.daysRemaining > 1) return `${assignment.daysRemaining} days left`;
  }

  if (assignment.status === "overdue" && assignment.daysOverdue > 0) {
    if (assignment.daysOverdue === 1) return "1 day overdue";
    return `${assignment.daysOverdue} days overdue`;
  }

  return null;
}

export function AssignmentCard({
  assignment,
  href,
  variant = "row",
  viewMode = "assigned",
}: {
  assignment: StudentAssignment;
  href: string;
  variant?: "row" | "card";
  viewMode?: AssignmentListViewMode;
}) {
  const subjectTone = getSubjectColor(assignment.subject);
  const displayStatus = getDisplayStatus(assignment);
  const daysLabel = getDaysLabel(assignment);

  if (variant === "row") {
    return (
      <Link href={href} className="block">
        <article className="group flex items-center gap-3 rounded-[20px] bg-white px-3 py-3 transition-all hover:-translate-y-0.5 hover:shadow-sm sm:px-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5",
              subjectTone.background,
            )}
          >
            <ClipboardList className={cn("h-5 w-5", subjectTone.text)} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#212121] transition-colors group-hover:text-[#283618]">
              {assignment.title}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-[#737373]">
              {assignment.subject}
            </p>
          </div>

          <div className="shrink-0 text-right">
            {viewMode === "missing" && assignment.dueDate ? (
              <p className="text-xs font-semibold text-[#bf4d42]">{formatShortDate(assignment.dueDate)}</p>
            ) : viewMode === "done" ? (
              assignment.submission?.marks != null ? (
                <p className="text-xs font-semibold text-[#212121]">
                  {assignment.submission.marks}/{assignment.totalMarks}
                </p>
              ) : (
                <p className="text-xs font-semibold text-[#2d8c53]">Turned in</p>
              )
            ) : assignment.dueDate ? (
              <p className="text-[11px] font-medium text-[#737373]">{formatShortDate(assignment.dueDate)}</p>
            ) : (
              <p className="text-[11px] font-medium text-[#a3a3a3]">No date</p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <article className="group rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cadab2] hover:shadow-md sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className={cn(
                "mb-3 flex h-11 w-11 items-center justify-center rounded-[16px] ring-1 ring-black/5",
                subjectTone.background,
              )}
            >
              <BookOpen className={cn("h-5 w-5", subjectTone.text)} />
            </div>
            <p className="text-base font-bold leading-tight text-[#212121] transition-colors group-hover:text-[#283618]">
              {assignment.title}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#737373]">
              {assignment.subject}
            </p>
          </div>

          <AssignmentStatusBadge status={displayStatus} size="sm" />
        </div>

        {assignment.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5f615a]">
            {assignment.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {assignment.createdAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#737373] ring-1 ring-[#ece5c8]">
              <CalendarDays className="h-3 w-3 text-[#283618]" />
              Shared {formatShortDate(assignment.createdAt)}
            </span>
          ) : null}
          {assignment.teacher?.name ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#737373]">
              <User className="h-3 w-3 text-[#414141]" />
              {assignment.teacher.name}
            </span>
          ) : null}
          {assignment.attachments && assignment.attachments.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7fd] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#356985] ring-1 ring-[#cfe6f5]">
              <FileText className="h-3 w-3" />
              {assignment.attachments.length} file{assignment.attachments.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#ece5c8]/70 pt-4">
          <div>
            {assignment.totalMarks > 0 ? (
              <p className="text-sm font-semibold text-[#212121]">{assignment.totalMarks} points</p>
            ) : (
              <p className="text-sm font-semibold text-[#212121]">Shared resource</p>
            )}
            {daysLabel ? (
              <p className="mt-1 text-xs font-medium text-[#737373]">{daysLabel}</p>
            ) : null}
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#faf8ef] text-[#283618] ring-1 ring-[#ece5c8] transition-colors group-hover:bg-[#eef7e6] group-hover:ring-[#cadab2]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}
