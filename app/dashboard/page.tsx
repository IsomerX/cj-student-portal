"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isToday, isTomorrow } from "date-fns";
import {
  ChevronRight,
  Clapperboard,
  GraduationCap,
  LibraryBig,
  Lock,
  LogOut,
  RefreshCw,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMyBatchesQuery } from "@/hooks/use-assignments";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";
import { useLiveClassesQuery, useRecordingsQuery } from "@/hooks/use-live-classes";
import { clearSession, getStoredToken } from "@/lib/auth/storage";
import type { LiveClass } from "@/lib/api/live-classes";
import { cn } from "@/lib/utils";
import { NameSetupDialog } from "@/components/NameSetupDialog";

type ModuleShortcut = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  href?: string;
  disabled?: boolean;
};

const moduleShortcuts: ModuleShortcut[] = [
  {
    title: "Live Classes",
    description: "Join classes the moment your teacher schedules them.",
    icon: Video,
    iconClassName: "bg-[#f6fbf2] text-[#2d8c53]",
    href: "/live",
  },
  {
    title: "Recordings",
    description: "Replay classes from all of your active CJ batches.",
    icon: Clapperboard,
    iconClassName: "bg-[#edf1fb] text-[#395189]",
    href: "/live/recordings",
  },
  {
    title: "Assignments",
    description: "Temporarily disabled for CJ students today.",
    icon: LibraryBig,
    iconClassName: "bg-[#f3f4f6] text-[#8f8f8f]",
    disabled: true,
  },
  {
    title: "Dost AI",
    description: "Temporarily disabled for CJ students today.",
    icon: Sparkles,
    iconClassName: "bg-[#f3f4f6] text-[#8f8f8f]",
    disabled: true,
  },
];

const DASHBOARD_QUOTES = [
  "Show up curious. Leave sharper.",
  "Consistency compounds faster than talent.",
  "Stay in the room. Growth happens live.",
  "Small wins today build big results later.",
  "The habit of showing up is half the work.",
  "One solid class can change the whole week.",
];

function getFirstName(name?: string | null) {
  if (!name || !name.trim()) return "Student";

  const firstName = name.trim().split(/\s+/)[0];
  return firstName || "Student";
}

function getGreetingLabel(timestamp?: string) {
  const hour = new Date(timestamp ?? Date.now()).getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatClassDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function formatClassTime(dateString: string): string {
  return format(new Date(dateString), "h:mm a");
}

function DashboardLoadingState() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f0f2f5] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:pb-12">
      <section className="h-64 w-full animate-pulse rounded-b-[32px] bg-[#283618]" />
      <div className="mx-auto max-w-6xl space-y-4 px-3 sm:px-6 lg:px-8">
        <div className="-mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-80 animate-pulse rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}

function DashboardMetaChip({ label }: { label: string }) {
  return (
    <div
      title={label}
      className="max-w-full truncate rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20"
    >
      {label}
    </div>
  );
}

function ModuleCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  href,
  disabled,
}: ModuleShortcut) {
  const content = (
    <article
      className={cn(
        "group flex flex-col justify-between rounded-[20px] border p-4 shadow-sm transition-all duration-300 sm:p-5",
        disabled
          ? "cursor-not-allowed border-[#ece5c8] bg-[#fafafa] opacity-80"
          : "cursor-pointer border-[#ece5c8] bg-white hover:-translate-y-0.5 hover:border-[#cadab2] hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-[14px] ring-1 ring-black/5 transition-transform duration-300",
            !disabled && "group-hover:scale-110",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
            disabled
              ? "bg-black/5 text-[#8f8f8f]"
              : "bg-black/5 text-[#414141] opacity-0 group-hover:opacity-100",
          )}
        >
          {disabled ? <Lock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-bold text-[#212121]">{title}</h3>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">{description}</p>
      </div>
    </article>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function LiveClassPreviewCard({ liveClass }: { liveClass: LiveClass }) {
  const isLive = liveClass.status === "LIVE";

  return (
    <Link
      href={`/live/${liveClass.id}?title=${encodeURIComponent(liveClass.title)}`}
      className={cn(
        "group flex flex-col rounded-[20px] border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5",
        isLive
          ? "border-[#fecaca] hover:border-[#fca5a5]"
          : "border-[#ece5c8] hover:border-[#cadab2]",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]",
                isLive ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#f3f4f6] text-[#414141]",
              )}
            >
              <Video className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-[#212121] sm:text-base">
                {liveClass.title}
              </h3>
              <p className="truncate text-xs font-medium text-[#737373]">
                {liveClass.batch?.name || "CJ Batch"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#737373]">
            <span className="rounded-full bg-[#f6f3eb] px-2.5 py-1 font-semibold text-[#5a513e]">
              {formatClassDate(liveClass.startAt)}
            </span>
            <span>{formatClassTime(liveClass.startAt)}</span>
            <span className="min-w-0 break-words">{liveClass.host?.name || "Unknown Host"}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              isLive ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#f3f4f6] text-[#525252]",
            )}
          >
            {isLive ? "Live" : "Scheduled"}
          </span>
          <ChevronRight className="h-4 w-4 text-[#a3a3a3] transition-colors group-hover:text-[#212121]" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const liveClassesQuery = useLiveClassesQuery();
  const batchesQuery = useMyBatchesQuery();
  const logoutMutation = useLogoutMutation();
  const [showNameSetup, setShowNameSetup] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  // Check if user needs to set their name
  React.useEffect(() => {
    if (profileQuery.data && !profileQuery.data.name?.trim()) {
      setShowNameSetup(true);
    }
  }, [profileQuery.data]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    scrollToTop();
    const frame = window.requestAnimationFrame(scrollToTop);
    const timeout = window.setTimeout(scrollToTop, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  React.useEffect(() => {
    if (profileQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [profileQuery.isError, router]);

  const batchIds = React.useMemo(
    () =>
      [...new Set((batchesQuery.data ?? []).map((batch) => batch.id).filter(Boolean))],
    [batchesQuery.data],
  );

  const recordingsQuery = useRecordingsQuery(batchIds);
  const [quoteIndex, setQuoteIndex] = React.useState(0);

  React.useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * DASHBOARD_QUOTES.length));
  }, []);

  const handleNameComplete = (name: string) => {
    setShowNameSetup(false);
    // Refetch profile to get updated data
    profileQuery.refetch();
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const handleRefresh = async () => {
    await Promise.all([
      liveClassesQuery.refetch(),
      batchesQuery.refetch(),
      recordingsQuery.refetch(),
    ]);
  };

  if (!token) {
    return null;
  }

  if (profileQuery.isLoading || liveClassesQuery.isLoading || batchesQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  const user = profileQuery.data;
  const liveClasses = liveClassesQuery.data ?? [];
  const liveNow = liveClasses.filter((liveClass) => liveClass.status === "LIVE");
  const upcoming = liveClasses.filter((liveClass) => liveClass.status === "SCHEDULED");
  const latestClasses = [...liveNow, ...upcoming].slice(0, 4);
  const studentName = getFirstName(user?.name);
  const greetingLabel = getGreetingLabel();
  const classDisplay =
    user?.classSection?.grade != null
      ? `${user.classSection.grade}${user.classSection.section ?? ""}`
      : null;
  const dashboardQuote = DASHBOARD_QUOTES[quoteIndex];

  const liveClassesError =
    liveClassesQuery.error instanceof Error ? liveClassesQuery.error.message : null;

  return (
    <>
      <NameSetupDialog open={showNameSetup} onComplete={handleNameComplete} />
      <main className="min-h-[100dvh] overflow-x-hidden bg-[#f0f2f5] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:pb-12">
        <section
          className="relative overflow-hidden rounded-b-[32px] bg-[#283618] px-3 pb-20 pt-5 shadow-lg sm:rounded-b-[40px] sm:px-6 sm:pb-28 sm:pt-6 lg:px-8"
          style={{ paddingTop: "max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem))" }}
        >
        <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#cadab2]/10 blur-3xl lg:translate-x-1/4" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                onClick={() => router.push("/profile")}
                className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[#283618] shadow-sm ring-2 ring-white/10 transition-transform hover:scale-105 active:scale-95 sm:h-12 sm:w-12 sm:rounded-[16px]"
              >
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-[10px]">
                  Student Portal
                </p>
                <p className="truncate text-lg font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
                  CJ Coaching
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={liveClassesQuery.isFetching || batchesQuery.isFetching || recordingsQuery.isFetching}
                className="h-9 rounded-[12px] border-0 bg-white/10 px-2.5 text-white backdrop-blur-md hover:bg-white/20 hover:text-white sm:px-3"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (liveClassesQuery.isFetching || batchesQuery.isFetching || recordingsQuery.isFetching) &&
                      "animate-spin",
                  )}
                />
                <span className="hidden sm:ml-2 sm:inline">Refresh</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="h-9 rounded-[12px] border-0 bg-white/10 px-2.5 text-white backdrop-blur-md hover:bg-white/20 hover:text-white sm:px-3"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-7 max-w-2xl space-y-4 sm:mt-10">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#cadab2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#283618] shadow-sm">
              <Sparkles className="h-3 w-3" />
              <span className="truncate">Live classes only</span>
            </div>

            <div className="space-y-2">
              <h1 className="break-words text-[clamp(1.75rem,8vw,2.75rem)] font-extrabold leading-[1.2] tracking-tight text-white">
                {greetingLabel}, <span className="text-[#cadab2]">{studentName}</span>.
              </h1>
              <p className="max-w-[34rem] text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                &quot;{dashboardQuote}&quot;
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {user?.school?.name ? (
                <DashboardMetaChip label={user.school.name} />
              ) : null}
              {classDisplay ? (
                <DashboardMetaChip label={`Class ${classDisplay}`} />
              ) : null}
              {batchesQuery.data?.map((batch) => (
                <DashboardMetaChip key={batch.id} label={batch.name} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-3 sm:-mt-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                  Live updates
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#212121]">Join from home</h2>
              </div>
              <Link
                href="/live"
                className="inline-flex w-full items-center justify-center gap-2 self-start whitespace-nowrap rounded-full bg-[#283618] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#1f2b13] min-[400px]:w-auto sm:self-auto"
              >
                Open live
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {liveClassesError ? (
              <div className="mt-5 rounded-[18px] border border-[#f5d0d0] bg-[#fff8f8] px-4 py-4 text-sm text-[#9c4c4c]">
                {liveClassesError}
              </div>
            ) : latestClasses.length === 0 && !liveClassesQuery.isLoading ? (
              <div className="mt-5 rounded-[20px] border border-dashed border-[#d9dfcf] bg-[#fafbf8] px-4 py-10 text-center sm:px-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#f6fbf2] text-[#2d8c53]">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#212121]">No live classes yet</h3>
                <p className="mt-2 text-sm text-[#737373]">
                  As soon as your teacher creates or starts a class, it will show up here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {latestClasses.map((liveClass) => (
                  <LiveClassPreviewCard key={liveClass.id} liveClass={liveClass} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                CJ modules
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#212121]">Available today</h2>
              <p className="mt-2 text-sm text-[#737373]">
                Only live classes and recordings are enabled right now. Everything else is temporarily locked.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {moduleShortcuts.map((module) => (
                <ModuleCard key={module.title} {...module} />
              ))}
            </div>
          </section>
        </div>
      </div>
      </main>
    </>
  );
}
