"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  RefreshCw,
  User,
  type LucideIcon,
} from "lucide-react";

import { AssignmentCard, type AssignmentListViewMode } from "@/components/assignments/assignment-card";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/custom-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAssignmentNoticesQuery,
  useMyAssignmentsQuery,
  useMyBatchesQuery,
} from "@/hooks/use-assignments";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";
import type { AssignmentNoticeItem, StudentAssignment } from "@/lib/api/assignments";
import { clearSession, getStoredToken } from "@/lib/auth/storage";
import { cn } from "@/lib/utils";

type PortalTab = "assignments" | "materials" | "notices";

type GroupedSection = {
  title: string;
  data: StudentAssignment[];
  defaultExpanded: boolean;
};

function getPortalTab(value: string | null): PortalTab {
  if (value === "materials" || value === "notices") {
    return value;
  }

  return "assignments";
}

function getViewMode(value: string | null): AssignmentListViewMode {
  if (value === "missing" || value === "done") {
    return value;
  }

  return "assigned";
}

function getReadableDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatRelativeDate(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getActivityStyle(type: string) {
  switch (type) {
    case "assignment_created":
      return { background: "bg-[#edf8f0]", text: "text-[#2d8c53]" };
    case "assignment_updated":
    case "assignment_due_date_changed":
      return { background: "bg-[#fff5dc]", text: "text-[#8a6914]" };
    case "material_uploaded":
      return { background: "bg-[#eff4ff]", text: "text-[#4b61aa]" };
    case "announcement_posted":
      return { background: "bg-[#eef7fd]", text: "text-[#356985]" };
    case "assignment_graded":
      return { background: "bg-[#f6fbf2]", text: "text-[#2d8c53]" };
    default:
      return { background: "bg-[#f0f2f5]", text: "text-[#737373]" };
  }
}

function groupAssignmentsByViewMode(
  assignments: StudentAssignment[],
  viewMode: AssignmentListViewMode,
): GroupedSection[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfWeek.getDate() + 7);
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);

  if (viewMode === "assigned") {
    const pending = assignments.filter((assignment) => assignment.status === "pending");
    const noDueDate: StudentAssignment[] = [];
    const thisWeek: StudentAssignment[] = [];
    const nextWeek: StudentAssignment[] = [];
    const later: StudentAssignment[] = [];

    for (const assignment of pending) {
      if (!assignment.dueDate) {
        noDueDate.push(assignment);
        continue;
      }

      const dueDate = new Date(assignment.dueDate);
      const normalizedDueDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      );

      if (normalizedDueDate < endOfWeek) {
        thisWeek.push(assignment);
      } else if (normalizedDueDate < endOfNextWeek) {
        nextWeek.push(assignment);
      } else {
        later.push(assignment);
      }
    }

    return [
      { title: "No due date", data: noDueDate, defaultExpanded: true },
      { title: "This week", data: thisWeek, defaultExpanded: true },
      { title: "Next week", data: nextWeek, defaultExpanded: false },
      { title: "Later", data: later, defaultExpanded: false },
    ].filter((section) => section.data.length > 0);
  }

  if (viewMode === "missing") {
    const overdue = assignments.filter((assignment) => assignment.status === "overdue");
    const thisWeek: StudentAssignment[] = [];
    const lastWeek: StudentAssignment[] = [];
    const earlier: StudentAssignment[] = [];

    for (const assignment of overdue) {
      if (!assignment.dueDate) {
        earlier.push(assignment);
        continue;
      }

      const dueDate = new Date(assignment.dueDate);
      const normalizedDueDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      );

      if (normalizedDueDate >= startOfWeek) {
        thisWeek.push(assignment);
      } else if (normalizedDueDate >= startOfLastWeek) {
        lastWeek.push(assignment);
      } else {
        earlier.push(assignment);
      }
    }

    return [
      { title: "This week", data: thisWeek, defaultExpanded: true },
      { title: "Last week", data: lastWeek, defaultExpanded: false },
      { title: "Earlier", data: earlier, defaultExpanded: true },
    ].filter((section) => section.data.length > 0);
  }

  const doneAssignments = assignments.filter((assignment) =>
    ["submitted", "late", "graded"].includes(assignment.status),
  );
  const noDueDate: StudentAssignment[] = [];
  const doneEarly: StudentAssignment[] = [];
  const thisWeek: StudentAssignment[] = [];
  const lastWeek: StudentAssignment[] = [];
  const earlier: StudentAssignment[] = [];

  for (const assignment of doneAssignments) {
    const submittedDate = assignment.submission?.submittedAt
      ? new Date(assignment.submission.submittedAt)
      : null;

    if (!assignment.dueDate && !submittedDate) {
      noDueDate.push(assignment);
      continue;
    }

    if (submittedDate && assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate);
      if (submittedDate < dueDate) {
        doneEarly.push(assignment);
        continue;
      }
    }

    const referenceDate = submittedDate || (assignment.dueDate ? new Date(assignment.dueDate) : null);
    if (!referenceDate) {
      noDueDate.push(assignment);
      continue;
    }

    const normalizedReferenceDate = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );

    if (normalizedReferenceDate >= startOfWeek) {
      thisWeek.push(assignment);
    } else if (normalizedReferenceDate >= startOfLastWeek) {
      lastWeek.push(assignment);
    } else {
      earlier.push(assignment);
    }
  }

  return [
    { title: "No due date", data: noDueDate, defaultExpanded: true },
    { title: "Done early", data: doneEarly, defaultExpanded: false },
    { title: "This week", data: thisWeek, defaultExpanded: false },
    { title: "Last week", data: lastWeek, defaultExpanded: false },
    { title: "Earlier", data: earlier, defaultExpanded: false },
  ].filter((section) => section.data.length > 0);
}

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-[#ece5c8]/70 bg-white p-3 text-center shadow-sm sm:p-5 transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[12px] sm:rounded-[14px] bg-[#faf8ef] text-[#283618] ring-1 ring-[#ece5c8]/70">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#212121]">
        {value}
      </p>
      <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#737373]">
        {label}
      </p>
      <p className="mt-2 hidden text-xs font-medium leading-relaxed text-[#737373] sm:block">
        {helper}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#283618] ring-1 ring-[#ece5c8]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-base font-bold text-[#212121]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#737373]">
        {description}
      </p>
    </div>
  );
}

function SectionError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#f2d5d1] bg-[#fff5f3] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#bf4d42] ring-1 ring-[#f2d5d1]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#212121]">{title}</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">
              {message}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}

function PortalLoadingState() {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-24 sm:pb-8">
      <section className="h-56 animate-pulse rounded-b-[32px] bg-[#283618] sm:h-64" />
      <div className="mx-auto -mt-10 max-w-6xl px-3 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-32 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
          <div className="h-32 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
          <div className="h-32 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
        </div>
        <div className="mt-4 h-[420px] rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
      </div>
    </main>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <section className="rounded-[20px] border border-[#ece5c8] bg-white px-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left",
          expanded ? "border-b border-[#ece5c8]/70" : "",
        )}
      >
        <p className="text-sm font-bold text-[#212121]">{title}</p>
        <div className="flex items-center gap-2 text-[#737373]">
          <span className="text-xs font-semibold">{count}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {expanded ? <div className="py-2">{children}</div> : null}
    </section>
  );
}

function NoticeCard({ item }: { item: AssignmentNoticeItem }) {
  if (item.feedType === "announcement") {
    return (
      <article className="rounded-[20px] border border-[#ece5c8] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ece6c8] text-sm font-bold text-[#414141]">
            {item.createdBy.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#212121]">
                  {item.createdBy.name}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#737373]">
                  {formatRelativeDate(item.createdAt)}
                </p>
              </div>
              <span className="rounded-full bg-[#faf8ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#737373] ring-1 ring-[#ece5c8]">
                Notice
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#4f514b]">
              {item.content}
            </p>
            {item.attachments && item.attachments.length > 0 ? (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#eef7fd] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#356985] ring-1 ring-[#cfe6f5]">
                <FileText className="h-3 w-3" />
                {item.attachments.length} attachment{item.attachments.length > 1 ? "s" : ""}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  const activityTone = getActivityStyle(item.type);

  return (
    <article className="rounded-[20px] border border-[#ece5c8] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            activityTone.background,
          )}
        >
          <Bell className={cn("h-4 w-4", activityTone.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#212121]">
                {item.createdBy.name}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#737373]">
                {formatRelativeDate(item.createdAt)}
              </p>
            </div>
            <span className="rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#737373]">
              Activity
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#4f514b]">{item.message}</p>
          {item.metadata?.assignmentTitle || item.metadata?.materialName ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.metadata.assignmentTitle ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#737373] ring-1 ring-[#ece5c8]">
                  <ClipboardList className="h-3 w-3 text-[#283618]" />
                  {item.metadata.assignmentTitle}
                </span>
              ) : null}
              {item.metadata.materialName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eff4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#4b61aa] ring-1 ring-[#d7dff2]">
                  <BookOpen className="h-3 w-3" />
                  {item.metadata.materialName}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AssignmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const logoutMutation = useLogoutMutation();

  const activeTab = getPortalTab(searchParams.get("tab"));
  const viewMode = getViewMode(searchParams.get("view"));

  React.useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  React.useEffect(() => {
    if (profileQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [profileQuery.isError, router]);

  const assignmentsQuery = useMyAssignmentsQuery({});
  const batchesQuery = useMyBatchesQuery();

  const profileClassSectionId =
    (profileQuery.data as { classSectionId?: string | null } | undefined)?.classSectionId ?? null;
  const classSectionIds = React.useMemo(() => {
    const ids = [
      profileClassSectionId,
      ...(batchesQuery.data ?? []).map((batch) => batch.classSectionId ?? null),
    ].filter((value): value is string => Boolean(value));

    return [...new Set(ids)];
  }, [batchesQuery.data, profileClassSectionId]);

  const noticesQuery = useAssignmentNoticesQuery(classSectionIds);

  const updateSearch = React.useCallback(
    (nextTab: PortalTab, nextViewMode?: AssignmentListViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", nextTab);

      if (nextTab === "assignments") {
        params.set("view", nextViewMode ?? viewMode);
      } else {
        params.delete("view");
      }

      router.replace(`/assignments?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, viewMode],
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const handleRefresh = async () => {
    await Promise.all([
      assignmentsQuery.refetch(),
      activeTab === "notices" ? noticesQuery.refetch() : Promise.resolve(),
      batchesQuery.refetch(),
    ]);
  };

  if (!token) {
    return null;
  }

  if (profileQuery.isLoading || assignmentsQuery.isLoading) {
    return <PortalLoadingState />;
  }

  const assignments = assignmentsQuery.data ?? [];
  const materialTypes = new Set(["material", "presentation", "lab_work", "other"]);
  const regularAssignments = assignments.filter((assignment) => !materialTypes.has(assignment.type));
  const materials = assignments
    .filter((assignment) => materialTypes.has(assignment.type))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });

  const groupedSections = groupAssignmentsByViewMode(regularAssignments, viewMode);
  const pendingCount = regularAssignments.filter((assignment) => assignment.status === "pending").length;
  const missingCount = regularAssignments.filter((assignment) => assignment.status === "overdue").length;
  const doneCount = regularAssignments.filter((assignment) =>
    ["submitted", "late", "graded"].includes(assignment.status),
  ).length;
  const noticesCount = noticesQuery.data?.length ?? 0;

  const stats = [
    {
      icon: ClipboardList,
      label: "Assigned",
      value: String(pendingCount),
      helper: pendingCount > 0 ? "Work still waiting on you." : "Nothing pending right now.",
    },
    {
      icon: AlertTriangle,
      label: "Missing",
      value: String(missingCount),
      helper: missingCount > 0 ? "Assignments that are past due." : "No missing work today.",
    },
    {
      icon: activeTab === "notices" ? Bell : CalendarDays,
      label: activeTab === "notices" ? "Notices" : "Completed",
      value: String(activeTab === "notices" ? noticesCount : doneCount),
      helper:
        activeTab === "notices"
          ? noticesCount > 0
            ? "Latest classroom updates and announcements."
            : "No classroom notices yet."
          : doneCount > 0
            ? "Turned in or graded work."
            : "No completed work yet.",
    },
  ];

  const assignmentsError =
    assignmentsQuery.error instanceof Error ? assignmentsQuery.error.message : null;
  const noticesError = noticesQuery.error instanceof Error ? noticesQuery.error.message : null;

  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-24 sm:pb-10">
      <section className="rounded-b-[32px] bg-[#283618] px-3 pb-8 pt-4 shadow-sm sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#283618] ring-2 ring-white/10">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Student Portal
                </p>
                <p className="text-xl font-extrabold tracking-tight text-white">Assignments</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRefresh()}
                className="h-10 rounded-[12px] border-0 bg-white/10 px-3 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="h-10 rounded-[12px] border-0 bg-white/10 px-3 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-7 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#cadab2]">
              {getReadableDate()}
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Track assignments and updates.
            </h1>
            <p className="mt-3 hidden sm:block max-w-2xl text-sm font-medium leading-6 text-white/80 sm:text-base">
              The web portal keeps the same assignment flow as the student app: pending work,
              submitted work, study materials, and notices in one place.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-4 sm:-mt-5 max-w-6xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {stats.map((item) => (
            <StatTile
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              helper={item.helper}
            />
          ))}
        </div>

        <section className="mt-8 rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-5">
          <Tabs value={activeTab} onValueChange={(value) => updateSearch(value as PortalTab)}>
            <TabsList className="grid h-12 w-full grid-cols-3 rounded-[16px] bg-white/60 p-1.5 shadow-sm ring-1 ring-[#ece5c8]">
              <TabsTrigger
                value="assignments"
                className="rounded-[12px] text-[13px] font-bold tracking-wide data-[state=active]:bg-[#283618] data-[state=active]:text-white"
              >
                Assignments
              </TabsTrigger>
              <TabsTrigger
                value="materials"
                className="rounded-[12px] text-[13px] font-bold tracking-wide data-[state=active]:bg-[#283618] data-[state=active]:text-white"
              >
                Materials
              </TabsTrigger>
              <TabsTrigger
                value="notices"
                className="rounded-[12px] text-[13px] font-bold tracking-wide data-[state=active]:bg-[#283618] data-[state=active]:text-white"
              >
                Notices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-sm font-bold text-[#212121]">View assignments</p>
                <div className="w-[140px]">
                  <CustomSelect
                    value={viewMode}
                    onChange={(val: string) => updateSearch("assignments", val as AssignmentListViewMode)}
                    options={[
                      { value: "assigned", label: "Assigned" },
                      { value: "missing", label: "Missing" },
                      { value: "done", label: "Done" },
                    ]}
                    variant="minimal"
                  />
                </div>
              </div>

              {assignmentsError ? (
                <SectionError
                  title="Assignments unavailable"
                  message={assignmentsError}
                  onRetry={() => {
                    void assignmentsQuery.refetch();
                  }}
                />
              ) : groupedSections.length > 0 ? (
                <div className="space-y-3">
                  {groupedSections.map((section) => (
                    <CollapsibleSection
                      key={section.title}
                      title={section.title}
                      count={section.data.length}
                      defaultExpanded={section.defaultExpanded}
                    >
                      <div className="space-y-1">
                        {section.data.map((assignment) => (
                          <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            href={`/assignments/${assignment.id}`}
                            variant="row"
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    </CollapsibleSection>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardList}
                  title={
                    viewMode === "assigned"
                      ? "No assigned work"
                      : viewMode === "missing"
                        ? "No missing work"
                        : "No completed work"
                  }
                  description={
                    viewMode === "assigned"
                      ? "You are all caught up. New assignments will appear here."
                      : viewMode === "missing"
                        ? "Great job. Nothing is overdue right now."
                        : "Completed assignments will show up here after you turn them in."
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="materials" className="mt-5">
              {assignmentsError ? (
                <SectionError
                  title="Materials unavailable"
                  message={assignmentsError}
                  onRetry={() => {
                    void assignmentsQuery.refetch();
                  }}
                />
              ) : materials.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {materials.map((material) => (
                    <AssignmentCard
                      key={material.id}
                      assignment={material}
                      href={`/assignments/${material.id}`}
                      variant="card"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No materials yet"
                  description="Study materials, presentations, and shared resources will appear here."
                />
              )}
            </TabsContent>

            <TabsContent value="notices" className="mt-5">
              {classSectionIds.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No class notices available"
                  description="We could not determine your current classroom sections for notices."
                />
              ) : noticesQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-32 animate-pulse rounded-[22px] border border-[#ece5c8] bg-[#faf8ef]" />
                  <div className="h-32 animate-pulse rounded-[22px] border border-[#ece5c8] bg-[#faf8ef]" />
                </div>
              ) : noticesError ? (
                <SectionError
                  title="Notices unavailable"
                  message={noticesError}
                  onRetry={() => {
                    void noticesQuery.refetch();
                  }}
                />
              ) : noticesQuery.data && noticesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {noticesQuery.data.map((item) => (
                    <NoticeCard key={`${item.feedType}:${item.id}`} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bell}
                  title="No notices yet"
                  description="Announcements and classroom activity will show up here when teachers post them."
                />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#ece5c8] bg-white/90 px-2 pt-2 backdrop-blur-lg sm:hidden">
        <Link
          href="/dashboard"
          className="flex min-w-[64px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[#737373]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link
          href="/assignments"
          className="flex min-w-[64px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[#283618]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef7e6]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">Assignments</span>
        </Link>
        <Link
          href="/doubts"
          className="flex min-w-[64px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[#737373]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent">
            <Bell className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Doubts</span>
        </Link>
        <button
          type="button"
          className="flex min-w-[64px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[#737373]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent">
            <User className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </main>
  );
}

export default function AssignmentsPage() {
  return (
    <React.Suspense fallback={<PortalLoadingState />}>
      <AssignmentsPageContent />
    </React.Suspense>
  );
}
