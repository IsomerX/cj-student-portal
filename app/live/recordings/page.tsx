"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Play, Video, Clock, HardDrive, Download } from "lucide-react";
import { useMyBatchesQuery } from "@/hooks/use-assignments";
import { useRecordingsQuery } from "@/hooks/use-live-classes";
import { Recording } from "@/lib/api/live-classes";
import { toast } from "sonner";

function formatDuration(seconds?: number | null): string {
    if (seconds == null || seconds <= 0) return "--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
}

function formatSize(bytes?: number | null): string {
    if (bytes == null || bytes <= 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso?: string): string {
    if (!iso) return "--";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "--";
    return format(d, "d MMM yyyy");
}

export default function RecordingsPage() {
    const router = useRouter();
    const batchesQuery = useMyBatchesQuery();
    const batchIds = [...new Set((batchesQuery.data || []).map((batch) => batch.id).filter(Boolean))];
    const { data: recordings, isLoading } = useRecordingsQuery(batchIds);

    const handleRecordingPress = (recording: Recording) => {
        // Open standard video URL in new tab or navigate to a dedicated player route
        // Here we just navigate to a simple player route passing URL
        router.push(
            `/live/recordings/play?url=${encodeURIComponent(
                recording.url
            )}&title=${encodeURIComponent(
                recording.liveClass?.title || "Recording"
            )}&batch=${encodeURIComponent(
                recording.liveClass?.batch?.name || ""
            )}`
        );
    };

    const handleDownload = (e: React.MouseEvent, recording: Recording) => {
        e.stopPropagation(); // Prevent card click

        if (recording.status !== "READY" || !recording.url) {
            toast.error("Recording not available for download");
            return;
        }

        // Create temporary anchor and trigger download
        const link = document.createElement("a");
        link.href = recording.url;
        link.download = `${recording.liveClass?.title || "Recording"} - ${formatDate(recording.liveClass?.startAt)}.mp4`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started");
    };

    return (
        <main className="min-h-[100dvh] bg-[#f0f2f5] pb-12">
            {/* Header */}
            <section
                className="border-b border-[#ece5c8] bg-white px-3 py-4 shadow-sm sm:px-6 lg:px-8"
                style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
            >
                <div className="mx-auto max-w-4xl flex items-center gap-4">
                    <Link
                        href="/live"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#414141] transition-colors hover:bg-[#e5e7eb]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-[#212121]">Class Recordings</h1>
                </div>
            </section>

            {/* Content Area */}
            <div className="mx-auto max-w-4xl px-3 pt-6 sm:px-6 lg:px-8">
                {(isLoading || batchesQuery.isLoading) ? (
                    <div className="space-y-4">
                        <div className="h-24 rounded-[20px] bg-white shadow-sm ring-1 ring-[#ece5c8] animate-pulse" />
                        <div className="h-24 rounded-[20px] bg-white shadow-sm ring-1 ring-[#ece5c8] animate-pulse" />
                    </div>
                ) : batchIds.length === 0 ? (
                    <div className="rounded-[24px] border border-[#ece5c8] bg-white px-5 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#f3f4f6] text-[#737373] ring-1 ring-[#e5e7eb]">
                            <Video className="h-8 w-8" />
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-[#212121]">No active batches found</h3>
                        <p className="mt-2 text-sm text-[#737373] max-w-md mx-auto">
                            Recordings appear once your student account is linked to an active CJ batch.
                        </p>
                    </div>
                ) : recordings?.length === 0 ? (
                    <div className="rounded-[24px] border border-[#ece5c8] bg-white px-5 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#f3f4f6] text-[#737373] ring-1 ring-[#e5e7eb]">
                            <Video className="h-8 w-8" />
                        </div>
                        <h3 className="mt-5 text-lg font-bold text-[#212121]">No recordings yet</h3>
                        <p className="mt-2 text-sm text-[#737373] max-w-md mx-auto">
                            Recordings from your past live sessions will appear here once they finish processing.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {recordings?.map((item: Recording) => {
                            const isReady = item.status === "READY";

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleRecordingPress(item)}
                                    disabled={!isReady}
                                    className={`group flex w-full items-center gap-4 rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-[#ece5c8] transition-all text-left ${isReady
                                            ? "cursor-pointer hover:-translate-y-1 hover:shadow-md hover:ring-[#cadab2]"
                                            : "cursor-not-allowed opacity-60"
                                        }`}
                                >
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${isReady ? "bg-[#283618] text-white" : "bg-[#f3f4f6] text-[#a3a3a3]"
                                            }`}
                                    >
                                        <Play className="h-5 w-5 ml-1" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="truncate font-bold text-[#212121] text-[15px] mb-1">
                                            {item.liveClass?.title || "Untitled Recording"}
                                        </h3>
                                        <p className="truncate text-xs text-[#737373] mb-2.5">
                                            {item.liveClass?.batch?.name || "Unknown Batch"} ·{" "}
                                            {formatDate(item.liveClass?.startAt || item.createdAt)}
                                        </p>

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-xs text-[#737373]">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{formatDuration(item.duration)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-[#737373]">
                                                    <HardDrive className="h-3.5 w-3.5" />
                                                    <span>{formatSize(item.size)}</span>
                                                </div>
                                            </div>

                                            {/* Download button - only show if downloadEnabled */}
                                            {item.downloadEnabled && isReady && (
                                                <button
                                                    onClick={(e) => handleDownload(e, item)}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#283618]/10 text-[#283618] transition-colors hover:bg-[#283618]/20"
                                                    aria-label="Download recording"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
