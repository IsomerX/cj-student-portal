"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
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
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
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

        {/* Quick Access Area */}
        <section className="mt-6 sm:mt-8 lg:mt-10">
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

    </main>
  );
}
