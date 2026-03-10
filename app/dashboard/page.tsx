"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Brain,
  CalendarCheck2,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/ui/filter-pill";
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
};

const moduleShortcuts: ModuleShortcut[] = [
  {
    title: "Attendance",
    description: "Daily status, summaries, and leave flow.",
    icon: CalendarCheck2,
    iconClassName: "bg-[#eef6e7] text-[#283618]",
  },
  {
    title: "Assignments",
    description: "Tasks, study material, and submissions.",
    icon: FileText,
    iconClassName: "bg-[#f4efe4] text-[#775f32]",
  },
  {
    title: "Exams",
    description: "Results, records, and performance views.",
    icon: GraduationCap,
    iconClassName: "bg-[#edf1fb] text-[#395189]",
  },
  {
    title: "Live Classes",
    description: "Join rooms, schedules, and class access.",
    icon: Video,
    iconClassName: "bg-[#f9ecec] text-[#975d5d]",
  },
  {
    title: "Doubt Portal",
    description: "Ask, track, and revisit your doubts.",
    icon: CircleHelp,
    iconClassName: "bg-[#fff3e1] text-[#9a6a12]",
  },
  {
    title: "Notebook AI",
    description: "Summaries, chat, quizzes, and study notes.",
    icon: Brain,
    iconClassName: "bg-[#f0ecfb] text-[#5c4a9d]",
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

function formatRoleLabel(role?: string) {
  if (!role) return null;

  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    <main className="min-h-screen bg-[#fff7eb] px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-3 sm:space-y-4">
        <div className="h-56 rounded-[28px] border border-[#ece5c8] bg-[#ece5c8]" />
        <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="h-64 rounded-[24px] border border-[#ece5c8] bg-white" />
          <div className="h-64 rounded-[24px] border border-[#ece5c8] bg-white" />
        </div>
        <div className="h-72 rounded-[24px] border border-[#ece5c8] bg-white" />
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 rounded-[24px] border border-[#ece5c8] bg-white" />
          <div className="space-y-3">
            <div className="h-36 rounded-[24px] border border-[#ece5c8] bg-white" />
            <div className="h-40 rounded-[24px] border border-[#ece5c8] bg-white" />
          </div>
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
    <div className="rounded-[20px] border border-white/70 bg-white/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
          {label}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#283618] shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-[#414141]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[#737373]">{helper}</p>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  icon: Icon,
  iconClassName,
}: ModuleShortcut) {
  return (
    <article className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-[#b3aa91]" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#414141]">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#737373]">{description}</p>
    </article>
  );
}

function ScheduleList({ schedule }: { schedule: StudentDashboardPeriod[] }) {
  if (schedule.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-5 text-sm text-[#737373]">
        No classes are scheduled for today.
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] px-4">
      {schedule.map((period, index) => (
        <div
          key={period.id}
          className={cn(
            "flex gap-3 py-4",
            index !== schedule.length - 1 ? "border-b border-[#ece5c8]" : "",
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ece5c8] bg-white text-sm font-semibold text-[#283618]">
            {period.periodNumber}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[#414141]">{period.subject}</p>
                <p className="mt-1 text-sm leading-6 text-[#737373]">
                  {period.time} · {period.teacher}
                </p>
              </div>

              <ScheduleStatusBadge status={period.status} />
            </div>

            {period.room || period.isSubstitution ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {period.room ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-[#737373]">
                    <MapPin className="h-3 w-3" />
                    {period.room}
                  </span>
                ) : null}

                {period.isSubstitution ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-[#737373]">
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
  const formattedRole = formatRoleLabel(user?.role);

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
  const upcomingEvents = dashboard?.upcomingEvents ?? [];

  return (
    <main className="min-h-screen bg-[#fff7eb] px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-3 sm:space-y-4">
        <section className="rounded-[28px] border border-[#ece5c8] bg-[#ece5c8] p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#31421f] bg-[#283618] text-white shadow-sm">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                  Student Portal
                </p>
                <p className="text-2xl font-bold text-[#414141]">CJ Coaching</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="shrink-0 bg-white"
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#283618]">
              <Sparkles className="h-3.5 w-3.5" />
              Student home
            </div>

            <div className="space-y-2">
              <h1 className="text-[1.9rem] font-bold leading-tight text-[#414141] sm:text-[2.3rem]">
                {greetingLabel}, {studentName}.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[#474747] sm:text-base">
                Here&apos;s your day at a glance for {displayDate}. Your classes, study tools, and
                important updates all start here.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {user?.school?.name ? (
                <FilterPill tone="neutral" selected>
                  {user.school.name}
                </FilterPill>
              ) : null}
              {classDisplay ? (
                <FilterPill tone="neutral" selected>
                  Class {classDisplay}
                </FilterPill>
              ) : null}
              {formattedRole ? <FilterPill selected>{formattedRole}</FilterPill> : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
        </section>

        <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                  Day focus
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#414141]">Next up</h2>
              </div>

              {dashboardError ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => dashboardQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              ) : null}
            </div>

            {dashboard ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                    {currentPeriod ? "In progress" : nextPeriod ? "Coming up" : "Today"}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[#414141]">
                    {currentPeriod?.subject ?? nextPeriod?.subject ?? "No classes right now"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#737373]">
                    {dashboard.nextUp.message}
                  </p>

                  {currentPeriod ?? nextPeriod ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <FilterPill tone="neutral" selected>
                        {(currentPeriod ?? nextPeriod)?.time ?? "Schedule"}
                      </FilterPill>
                      {(currentPeriod ?? nextPeriod)?.teacher ? (
                        <FilterPill tone="neutral" selected>
                          {(currentPeriod ?? nextPeriod)?.teacher}
                        </FilterPill>
                      ) : null}
                      {(currentPeriod ?? nextPeriod)?.room ? (
                        <FilterPill tone="neutral" selected>
                          Room {(currentPeriod ?? nextPeriod)?.room}
                        </FilterPill>
                      ) : null}
                    </div>
                  ) : null}

                  {currentPeriod && nextPeriod ? (
                    <div className="mt-4 rounded-2xl bg-white p-3 text-sm text-[#474747]">
                      <span className="font-semibold text-[#414141]">After this:</span> {nextPeriod.subject} at{" "}
                      {nextPeriod.time}.
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[20px] border border-[#ece5c8] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#283618]/10 text-[#283618]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#414141]">
                        {alerts.length > 0 ? "Important schedule updates" : "You&apos;re ready to begin"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#737373]">
                        {alerts.length > 0
                          ? alerts[0]?.message
                          : "No schedule changes are showing right now. Use the quick access cards below to move into the rest of your workspace."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1ef] text-[#bf4d42]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#414141]">Dashboard data is unavailable</p>
                    <p className="mt-1 text-sm leading-6 text-[#737373]">
                      {dashboardError ||
                        "We could not load today&apos;s student summary right now. Try refreshing the home view."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 sm:p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Student spaces
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#414141]">Quick access</h2>
              <p className="mt-2 text-sm leading-6 text-[#737373]">
                The student portal modules are organized from here so the rest of the product can
                keep the same UI baseline as the new login.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {moduleShortcuts.map((module) => (
                <ModuleCard key={module.title} {...module} />
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                  Today
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#414141]">Class schedule</h2>
              </div>
              {dashboard?.today.dayOfWeek ? (
                <FilterPill tone="neutral" selected>
                  {dashboard.today.dayOfWeek}
                </FilterPill>
              ) : null}
            </div>

            <div className="mt-5">
              {dashboard ? (
                <ScheduleList schedule={schedule} />
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-5 text-sm text-[#737373]">
                  Schedule details will appear here once the student home data is available.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-3">
            <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Updates
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#414141]">Alerts</h2>

              {dashboard ? (
                alerts.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <article
                        key={alert.id}
                        className="rounded-[20px] border border-[#f2d5d1] bg-[#fff5f3] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#bf4d42]">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#414141]">{alert.subject || "Update"}</p>
                            <p className="mt-1 text-sm leading-6 text-[#737373]">{alert.message}</p>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b7d7b]">
                              {alert.time}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#283618]/10 text-[#283618]">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#414141]">All clear</p>
                        <p className="mt-1 text-sm leading-6 text-[#737373]">
                          There are no classroom alerts or substitution updates at the moment.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-4 text-sm text-[#737373]">
                  Alerts will appear here after the dashboard summary loads.
                </div>
              )}
            </section>

            <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Next 7 days
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#414141]">Upcoming events</h2>

              {dashboard ? (
                upcomingEvents.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {upcomingEvents.map((event) => (
                      <article
                        key={event.id}
                        className="flex items-start gap-3 rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#ece5c8] bg-white text-[#283618]">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                            {getEventDateLabel(event.date).split(" ")[0]}
                          </span>
                          <span className="text-sm font-bold">
                            {getEventDateLabel(event.date).split(" ")[1]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#414141]">{event.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[#737373]">
                            {event.type || "Event"} · {getEventDateLabel(event.date)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4 text-sm text-[#737373]">
                    No upcoming events are showing yet for the next week.
                  </div>
                )
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] p-4 text-sm text-[#737373]">
                  Event reminders will show here after the student home summary loads.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
