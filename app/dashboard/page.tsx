"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Brain,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
  Video,
  Home,
  User,
  Users,
  FileCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";
import { useStudentDashboardQuery } from "@/hooks/use-student-dashboard";
import type { DashboardScheduleStatus, StudentDashboardPeriod } from "@/lib/api/student-dashboard";
import { clearSession, getStoredToken } from "@/lib/auth/storage";
import { cn } from "@/lib/utils";

type ModuleShortcut = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  href?: string;
};

const moduleShortcuts: ModuleShortcut[] = [
  {
    title: "Ask a Doubt",
    description: "Get instant AI-powered answers",
    icon: CircleHelp,
    iconClassName: "bg-[#fff3e1] text-[#9a6a12]",
    href: "/doubts?tab=ask",
  },
  {
    title: "Assignments",
    description: "View homework & submissions",
    icon: FileText,
    iconClassName: "bg-[#f4efe4] text-[#775f32]",
    href: "/assignments",
  },
  {
    title: "Doubt Feed",
    description: "See what your classmates are asking",
    icon: Users,
    iconClassName: "bg-[#edf1fb] text-[#395189]",
    href: "/doubts?tab=feed",
  },
  {
    title: "Test Results",
    description: "View graded exam papers",
    icon: FileCheck,
    iconClassName: "bg-[#f9ecec] text-[#975d5d]",
  },
];

const scheduleStatusStyles: Record<
  DashboardScheduleStatus,
  {
    label: string;
    className: string;
  }
> = {
  completed: {
    label: "Done",
    className: "border-transparent bg-[#f3f4ee] text-[#737373]",
  },
  ongoing: {
    label: "Now",
    className: "border-[#cadab2] bg-[#eef7e6] text-[#283618]",
  },
  upcoming: {
    label: "Next",
    className: "border-[#ecd7a6] bg-[#fff6df] text-[#8d6c0d]",
  },
};

function getFirstName(name?: string | null) {
  if (!name) return "Student";

  const firstName = name.trim().split(/\s+/)[0];
  return firstName || "Student";
}

function getGreetingLabel(timestamp?: string) {
  const hour = new Date(timestamp ?? Date.now()).getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getReadableDate(timestamp?: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp ?? Date.now()));
}

function getEventDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}


function ScheduleStatusBadge({ status }: { status: DashboardScheduleStatus }) {
  const style = scheduleStatusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}

function DashboardLoadingState() {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-20 sm:pb-8">
      <section className="h-60 sm:h-72 w-full animate-pulse bg-[#283618] rounded-b-[32px]" />
      <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="-mt-20 sm:-mt-24 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div className="h-32 rounded-[20px] bg-white shadow-sm border border-[#ece5c8] animate-pulse" />
          <div className="h-32 rounded-[20px] bg-white shadow-sm border border-[#ece5c8] animate-pulse" />
          <div className="h-32 rounded-[20px] bg-white shadow-sm border border-[#ece5c8] animate-pulse" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-72 rounded-[24px] bg-white border border-[#ece5c8] shadow-sm animate-pulse" />
          <div className="h-72 rounded-[24px] bg-white border border-[#ece5c8] shadow-sm animate-pulse" />
        </div>
      </div>
    </main>
  );
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
    <div className="group relative overflow-hidden rounded-[20px] border border-[#ece5c8]/50 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
          {label}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#faf8ef] text-[#283618] shadow-none ring-1 ring-[#ece5c8]/60 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-[#212121] sm:text-4xl">{value}</p>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#737373] line-clamp-2">{helper}</p>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  href,
}: ModuleShortcut) {
  const content = (
    <article className="group flex cursor-pointer flex-col justify-between rounded-[20px] border border-[#ece5c8] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cadab2] hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[14px] shadow-none ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <ChevronRight className="h-4 w-4 text-[#414141]" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-bold text-[#212121]">{title}</h3>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373] line-clamp-2">{description}</p>
      </div>
    </article>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ScheduleList({ schedule }: { schedule: StudentDashboardPeriod[] }) {
  if (schedule.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-5 text-sm font-medium text-[#737373] text-center">
        No classes are scheduled for today.
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#ece5c8] bg-white px-4 sm:px-5 shadow-sm">
      {schedule.map((period, index) => (
        <div
          key={period.id}
          className={cn(
            "group flex gap-3 py-4 transition-all duration-300",
            index !== schedule.length - 1 ? "border-b border-[#ece5c8]/60" : "",
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#ece5c8] bg-[#faf8ef] text-sm font-bold text-[#283618] transition-colors duration-300 group-hover:bg-[#eef7e6] group-hover:border-[#cadab2]">
            {period.periodNumber}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#212121] transition-colors duration-300 group-hover:text-[#283618]">{period.subject}</p>
                <p className="mt-0.5 text-xs font-medium leading-5 text-[#737373]">
                  <span className="text-[#414141]">{period.time}</span> · {period.teacher}
                </p>
              </div>

              <ScheduleStatusBadge status={period.status} />
            </div>

            {period.room || period.isSubstitution ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {period.room ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ef] border border-[#ece5c8] px-2.5 py-1 text-[10px] font-semibold text-[#414141] uppercase tracking-wider">
                    <MapPin className="h-3 w-3 text-[#283618]" />
                    {period.room}
                  </span>
                ) : null}

                {period.isSubstitution ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f3] border border-[#f2d5d1] px-2.5 py-1 text-[10px] font-semibold text-[#bf4d42] uppercase tracking-wider">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Teacher update
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const dashboardQuery = useStudentDashboardQuery();
  const logoutMutation = useLogoutMutation();

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

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  if (!token) {
    return null;
  }

  if (profileQuery.isLoading || dashboardQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  const user = profileQuery.data;
  const dashboard = dashboardQuery.data;
  const dashboardError =
    dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;

  const studentName = getFirstName(user?.name ?? dashboard?.student.name);
  const greetingLabel = getGreetingLabel(dashboard?.timestamp);
  const displayDate = getReadableDate(dashboard?.timestamp);
  const classDisplay =
    dashboard?.student.classDisplay ??
    (user?.classSection?.grade != null
      ? `${user.classSection.grade}${user.classSection.section ?? ""}`
      : null);

  const statTiles = dashboard
    ? [
      {
        label: "Classes today",
        value: String(dashboard.today.totalPeriods),
        helper: classDisplay ? `Class ${classDisplay}` : "Your day plan is ready.",
        icon: Clock3,
      },
      {
        label: "Schedule alerts",
        value: String(dashboard.alerts.count),
        helper:
          dashboard.alerts.count > 0
            ? "Check class updates before you join."
            : "No changes announced for today.",
        icon: Bell,
      },
      {
        label: "Upcoming events",
        value: String(dashboard.upcomingEvents.length),
        helper:
          dashboard.upcomingEvents.length > 0
            ? `${dashboard.upcomingEvents[0]?.title || "Next event"} on ${getEventDateLabel(
              dashboard.upcomingEvents[0]?.date || dashboard.today.date,
            )}`
            : "Nothing scheduled over the next week.",
        icon: CalendarDays,
      },
    ]
    : [
      {
        label: "Workspaces",
        value: String(moduleShortcuts.length),
        helper: "Attendance, classes, exams, doubts, and AI tools.",
        icon: Sparkles,
      },
      {
        label: "Session",
        value: "Ready",
        helper: "Your account is signed in and available.",
        icon: ShieldCheck,
      },
      {
        label: "Home data",
        value: "Retry",
        helper: "Refresh the student home summary below.",
        icon: RefreshCw,
      },
    ];

  const currentPeriod = dashboard?.nextUp.current ?? null;
  const nextPeriod = dashboard?.nextUp.next ?? null;
  const schedule = dashboard?.schedule ?? [];
  const alerts = dashboard?.alerts.items ?? [];

  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-24 sm:pb-12">
      {/* Dark Header Section */}
      <section className="relative px-3 pb-24 pt-5 sm:px-6 sm:pb-32 sm:pt-6 lg:px-8 lg:pb-36 lg:pt-8 bg-[#283618] rounded-b-[32px] sm:rounded-b-[40px] shadow-lg overflow-hidden">
        {/* Decorative background blobs for depth */}
        <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#cadab2]/10 blur-3xl lg:translate-x-1/4" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[14px] sm:rounded-[16px] bg-white text-[#283618] shadow-sm ring-2 ring-white/10 transition-transform duration-300 hover:scale-105">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Student Portal
                </p>
                <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white lg:text-2xl">CJ Coaching</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md rounded-[12px] h-9 px-3 transition-all duration-300 hover:scale-105 border-0 focus:ring-2 focus:ring-white/50"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
            </Button>
          </div>

          <div className="mt-8 sm:mt-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#cadab2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#283618] shadow-sm">
              <Sparkles className="h-3 w-3" />
              Student home
            </div>

            <div className="space-y-2">
              <h1 className="text-[1.75rem] sm:text-[2.25rem] font-extrabold leading-tight tracking-tight text-white lg:text-[2.75rem]">
                {greetingLabel}, <span className="text-[#cadab2]">{studentName}</span>.
              </h1>
              <p className="text-sm sm:text-base font-medium leading-relaxed text-white/80">
                Here&apos;s your day at a glance for {displayDate}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {user?.school?.name ? (
                <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
                  {user.school.name}
                </div>
              ) : null}
              {classDisplay ? (
                <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
                  Class {classDisplay}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
        {/* Stat Tiles (Overlapping, Solid, Condensed) */}
        <div className="-mt-16 sm:-mt-20 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {statTiles.map((tile) => (
            <StatTile
              key={tile.label}
              icon={tile.icon}
              label={tile.label}
              value={tile.value}
              helper={tile.helper}
            />
          ))}
        </div>

        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:mt-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Main Focus Area */}
          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                  Day focus
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#212121]">Next up</h2>
              </div>

              {dashboardError ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => dashboardQuery.refetch()}
                  className="rounded-full shadow-sm h-8 px-3 text-xs"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
              ) : null}
            </div>

            {dashboard ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4 shadow-inner">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                    {currentPeriod ? "In progress" : nextPeriod ? "Coming up" : "Today"}
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-tight text-[#283618] sm:text-2xl">
                    {currentPeriod?.subject ?? nextPeriod?.subject ?? "No classes right now"}
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-[#737373] sm:text-sm">
                    {dashboard.nextUp.message}
                  </p>

                  {currentPeriod ?? nextPeriod ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="rounded-[10px] bg-white px-2.5 py-1 text-xs font-bold text-[#414141] shadow-sm ring-1 ring-[#ece5c8]">
                        {(currentPeriod ?? nextPeriod)?.time ?? "Schedule"}
                      </div>
                      {(currentPeriod ?? nextPeriod)?.teacher ? (
                        <div className="rounded-[10px] bg-white px-2.5 py-1 text-xs font-bold text-[#414141] shadow-sm ring-1 ring-[#ece5c8]">
                          {(currentPeriod ?? nextPeriod)?.teacher}
                        </div>
                      ) : null}
                      {(currentPeriod ?? nextPeriod)?.room ? (
                        <div className="rounded-[10px] flex items-center gap-1.5 bg-[#eef7e6] text-[#283618] px-2.5 py-1 text-xs font-bold shadow-sm ring-1 ring-[#cadab2]">
                          <MapPin className="h-3 w-3" />
                          Room {(currentPeriod ?? nextPeriod)?.room}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {currentPeriod && nextPeriod ? (
                    <div className="mt-4 rounded-[12px] border border-[#ece5c8]/60 bg-white p-3 text-xs font-medium text-[#737373] shadow-sm">
                      <span className="font-bold text-[#414141]">After this:</span> <span className="text-[#212121]">{nextPeriod.subject}</span> at{" "}
                      {nextPeriod.time}.
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[20px] border border-[#ece5c8] bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f4f7f1] text-[#283618] ring-1 ring-[#cadab2]/50">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#212121]">
                        {alerts.length > 0 ? "Important schedule updates" : "You're ready to begin"}
                      </p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">
                        {alerts.length > 0
                          ? alerts[0]?.message
                          : "No schedule changes are showing right now. Use the quick access cards below."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#fff5f3] text-[#bf4d42] ring-1 ring-[#f2d5d1]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#212121]">Dashboard data is unavailable</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">
                      {dashboardError ||
                        "We could not load today's student summary right now. Try refreshing the home view."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Quick Access Area */}
          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                Student spaces
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#212121]">Quick access</h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
              {moduleShortcuts.map((module) => (
                <ModuleCard key={module.title} {...module} />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:mt-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                  Today
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#212121]">Class schedule</h2>
              </div>
              {dashboard?.today.dayOfWeek ? (
                <div className="rounded-[10px] bg-[#faf8ef] px-3 py-1 text-xs font-bold text-[#414141] shadow-sm ring-1 ring-[#ece5c8]">
                  {dashboard.today.dayOfWeek}
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              {dashboard ? (
                <ScheduleList schedule={schedule} />
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-5 text-sm font-medium text-[#737373] text-center">
                  Schedule details will appear here once the student home data is available.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                Updates
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#212121]">Alerts</h2>

              {dashboard ? (
                alerts.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <article
                        key={alert.id}
                        className="group rounded-[20px] border border-[#f2d5d1] bg-[#fff5f3] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#bf4d42] shadow-sm">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#212121]">{alert.subject || "Update"}</p>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">{alert.message}</p>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#bf4d42]/70">
                              {alert.time}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f4f7f1] text-[#283618] ring-1 ring-[#cadab2]/50">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#212121]">All clear</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">
                          There are no classroom alerts or substitution updates at the moment.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-4 rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-4 text-xs font-medium text-[#737373] text-center">
                  Alerts will appear here after the dashboard summary loads.
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* Persistent Bottom Nav (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#ece5c8] bg-white/90 px-2 pb-safe pt-2 backdrop-blur-lg sm:hidden">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-[#283618]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef7e6]">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/ai" className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Dost AI</span>
        </Link>
        <Link href="/live" className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
            <Video className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Live</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
            <User className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </main>
  );
}
