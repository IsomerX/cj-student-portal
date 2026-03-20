"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";
import { fetchPlaybackOtp } from "@/lib/api/live-classes";

function RecordingPlayerContent() {
    const searchParams = useSearchParams();
    const recordingId = searchParams?.get("recordingId");
    const title = searchParams?.get("title") || "Recording";
    const batch = searchParams?.get("batch") || "";

    const [loading, setLoading] = useState(true);
    const [otp, setOtp] = useState<string | null>(null);
    const [playbackInfo, setPlaybackInfo] = useState<string | null>(null);
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!recordingId) return;

        let cancelled = false;
        let pollTimer: ReturnType<typeof setTimeout> | undefined;
        setLoading(true);
        setError(null);

        const fetchOtp = () => {
            fetchPlaybackOtp(recordingId)
                .then((data) => {
                    if (cancelled) return;
                    if (data.otp && data.playbackInfo) {
                        setOtp(data.otp);
                        setPlaybackInfo(data.playbackInfo);
                        setProcessing(false);
                        setLoading(false);
                    } else if (data.processing) {
                        setProcessing(true);
                        setLoading(false);
                        pollTimer = setTimeout(fetchOtp, 5000);
                    } else if (data.fallback && data.url) {
                        setFallbackUrl(data.url);
                        setLoading(false);
                    } else {
                        setError("Could not load playback data.");
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    if (cancelled) return;
                    setError(err?.message || "Failed to load recording.");
                    setLoading(false);
                });
        };

        fetchOtp();

        return () => {
            cancelled = true;
            clearTimeout(pollTimer);
        };
    }, [recordingId]);

    if (!recordingId) {
        return (
            <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f0f2f5] p-5">
                <PlayCircle className="h-16 w-16 text-[#a3a3a3] mb-4" />
                <h1 className="text-xl font-bold text-[#212121]">Invalid Recording Link</h1>
                <p className="text-[#737373] mt-2 mb-6">No recording ID was found in the link.</p>
                <Link
                    href="/live/recordings"
                    className="rounded-[12px] bg-[#283618] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a2310]"
                >
                    Go back to recordings
                </Link>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f0f2f5] p-5">
                <PlayCircle className="h-16 w-16 text-[#a3a3a3] mb-4" />
                <h1 className="text-xl font-bold text-[#212121]">Playback Error</h1>
                <p className="text-[#737373] mt-2 mb-6">{error}</p>
                <Link
                    href="/live/recordings"
                    className="rounded-[12px] bg-[#283618] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a2310]"
                >
                    Go back to recordings
                </Link>
            </main>
        );
    }

    return (
        <main className="flex min-h-[100dvh] flex-col bg-black">
            {/* Dark overlay header on top of black background for minimal distraction */}
            <header className="flex w-full items-center gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 py-4 sm:px-6 z-10">
                <Link
                    href="/live/recordings"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="truncate text-base font-bold text-white sm:text-lg">{title}</h1>
                    {batch && <p className="truncate text-xs text-white/70">{batch}</p>}
                </div>
            </header>

            {/* Player Area */}
            <div className="flex flex-1 items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-white/60" />
                        <p className="text-sm text-white/50">Loading player...</p>
                    </div>
                ) : processing ? (
                    <div className="flex flex-col items-center gap-4 px-6 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                        <p className="text-base font-medium text-white">Encrypting with DRM...</p>
                        <p className="text-sm text-white/50">Video is being processed for secure playback. This usually takes a few minutes.</p>
                    </div>
                ) : otp && playbackInfo ? (
                    <iframe
                        src={`https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`}
                        style={{ border: 0, width: "100%", height: "100%" }}
                        className="max-h-[calc(100vh-80px)]"
                        allow="encrypted-media"
                        allowFullScreen
                    />
                ) : fallbackUrl ? (
                    <video
                        src={fallbackUrl}
                        controls
                        autoPlay
                        playsInline
                        className="h-full w-full max-h-[calc(100vh-80px)] object-contain"
                    >
                        Your browser does not support the video tag.
                    </video>
                ) : null}
            </div>
        </main>
    );
}

export default function RecordingPlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] bg-black"></div>}>
            <RecordingPlayerContent />
        </Suspense>
    );
}
