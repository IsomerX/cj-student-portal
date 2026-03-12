"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { format, isToday, isTomorrow } from "date-fns";
import {
    GraduationCap,
    LogOut,
    Video,
    Clock,
    Users,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { useLiveClassesQuery } from "@/hooks/use-live-classes";
import { LiveClass } from "@/lib/api/live-classes";
import { cn } from "@/lib/utils";

function formatClassDate(dateString: string): string {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
}

function formatClassTime(dateString: string): string {
    return format(new Date(dateString), "h:mm a");
}

function LiveClassCard({
    liveClass,
    onPress,
}: {
    liveClass: LiveClass;
    onPress: () => void;
}) {
    const isLive = liveClass.status === "LIVE";
    const isScheduled = liveClass.status === "SCHEDULED";
    const isJoinable = isLive || isScheduled;

    const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
        LIVE: { label: "LIVE", bg: "#fef2f2", text: "#dc2626" },
        SCHEDULED: { label: "SCHEDULED", bg: "#f3f4f6", text: "#414141" },
        ENDED: { label: "ENDED", bg: "#f3f4f6", text: "#767676" },
        CANCELLED: { label: "CANCELLED", bg: "#f3f4f6", text: "#767676" },
    };

    const status = statusConfig[liveClass.status] || statusConfig.ENDED;

    return (
        <button
            onClick={onPress}
            disabled={!isJoinable}
            className={cn(
                "group flex w-full flex-col cursor-pointer rounded-[24px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-[#ece5c8] transition-all flex-col text-left",
                isJoinable && "hover:ring-[#cadab2] hover:shadow-md hover:-translate-y-1",
                isLive && "ring-[#fecaca] hover:ring-[#fca5a5]"
            )}
        >
            <div className="flex w-full items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                    <div
                        className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
                            isLive ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#f3f4f6] text-[#414141]"
                        )}
                    >
                        <Video className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="truncate font-bold text-[#212121] text-base mb-0.5">
                            {liveClass.title}
                        </h3>
                        <p className="truncate text-sm text-[#737373] mb-0.5">
                            {liveClass.host?.name || "Unknown Host"}
                        </p>
                        <p className="truncate text-xs text-[#737373]">
                            {liveClass.batch?.name || ""}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                    <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ backgroundColor: status.bg, color: status.text }}
                    >
                        {status.label}
                        {isLive && (
                            <span className="ml-1.5 flex h-1.5 w-1.5 rounded-full bg-[#dc2626] animate-pulse" />
                        )}
                    </span>
                    {isJoinable && (
                        <ChevronRight className="h-5 w-5 text-[#a3a3a3] group-hover:text-[#212121] transition-colors" />
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#f3f4f6] pt-4">
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#737373]">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="break-words">
                        {formatClassDate(liveClass.startAt)} at {formatClassTime(liveClass.startAt)}
                    </span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#737373]">
                    <Users className="h-3.5 w-3.5" />
                    <span>{liveClass._count?.attendance || 0} attended</span>
                </div>
            </div>
        </button>
    );
}

export default function LiveClassesPage() {
    const router = useRouter();
    const { data: classes, isLoading } = useLiveClassesQuery();

    const logoutMutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            router.push("/login");
        },
    });

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    const handleClassPress = (liveClass: LiveClass) => {
        if (liveClass.status === "LIVE" || liveClass.status === "SCHEDULED") {
            router.push(`/live/${liveClass.id}?title=${encodeURIComponent(liveClass.title)}`);
        }
    };

    const liveClasses = classes?.filter((c) => c.status === "LIVE") || [];
    const scheduledClasses = classes?.filter((c) => c.status === "SCHEDULED") || [];
    const endedClasses =
        classes?.filter((c) => c.status === "ENDED" || c.status === "CANCELLED") || [];

    return (
        <>
            <main className="min-h-[100dvh] overflow-x-hidden bg-[#f0f2f5] pb-36 sm:pb-12">
                {/* Header */}
                <section className="relative rounded-b-[32px] bg-[#283618] px-3 pb-8 pt-5 shadow-lg sm:rounded-b-[40px] sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 overflow-hidden">
                    <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#cadab2]/10 blur-3xl lg:translate-x-1/4" />

                    <div className="relative mx-auto max-w-6xl">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[14px] sm:rounded-[16px] bg-white text-[#283618] shadow-sm ring-2 ring-white/10">
                                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                                        Student Portal
                                    </p>
                                    <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white lg:text-2xl">
                                        Live Classes
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                disabled={logoutMutation.isPending}
                                className="shrink-0 rounded-[12px] border-0 bg-white/10 px-3 h-9 text-white backdrop-blur-md hover:bg-white/20 hover:text-white focus:ring-2 focus:ring-white/50"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                    {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                                </span>
                            </Button>
                        </div>

                        <div className="mt-8 sm:mt-10 max-w-2xl space-y-4">
                            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-extrabold leading-tight tracking-tight text-white lg:text-[2.75rem]">
                                Live Classes
                            </h1>
                            <p className="text-sm sm:text-base font-medium leading-relaxed text-white/80">
                                Join live interactive sessions with your teachers and access recordings of past classes.
                            </p>
                            <Link
                                href="/live/recordings"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#283618] shadow-sm transition-all hover:bg-white/90 hover:shadow-md active:scale-[0.97]"
                            >
                                <Video className="h-4 w-4" />
                                View Recordings
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Content Area */}
                <div className="relative z-10 mx-auto mt-4 sm:mt-6 max-w-4xl px-3 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="h-8 w-48 rounded-[12px] bg-black/5 animate-pulse" />
                            <div className="h-32 rounded-[24px] bg-white shadow-sm ring-1 ring-[#ece5c8] animate-pulse" />
                        </div>
                    ) : classes?.length === 0 ? (
                        <div className="rounded-[24px] border border-[#ece5c8] bg-white px-5 py-12 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#f6fbf2] text-[#2d8c53] ring-1 ring-[#d9ead0]">
                                <Video className="h-6 w-6" />
                            </div>
                            <h3 className="mt-5 text-lg font-bold text-[#212121]">No classes yet</h3>
                            <p className="mt-2 text-sm text-[#737373]">
                                Live sessions will appear here when scheduled by your teachers.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {liveClasses.length > 0 && (
                                <section>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#dc2626] mb-4 pl-1 flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-[#dc2626] animate-pulse" />
                                        Live Now
                                    </h2>
                                    <div className="grid gap-3 sm:gap-4">
                                        {liveClasses.map((c) => (
                                            <LiveClassCard key={c.id} liveClass={c} onPress={() => handleClassPress(c)} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {scheduledClasses.length > 0 && (
                                <section>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#737373] mb-4 pl-1">
                                        Upcoming
                                    </h2>
                                    <div className="grid gap-3 sm:gap-4">
                                        {scheduledClasses.map((c) => (
                                            <LiveClassCard key={c.id} liveClass={c} onPress={() => handleClassPress(c)} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {endedClasses.length > 0 && (
                                <section>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#a3a3a3] mb-4 pl-1">
                                        Past
                                    </h2>
                                    <div className="grid gap-3 sm:gap-4 opacity-70">
                                        {endedClasses.map((c) => (
                                            <LiveClassCard key={c.id} liveClass={c} onPress={() => handleClassPress(c)} />
                                        ))}
                                    </div>
                                </section>
                            )}

                        </div>
                    )}
                </div>
            </main>

        </>
    );
}
