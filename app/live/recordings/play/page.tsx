"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";

function RecordingPlayerContent() {
    const searchParams = useSearchParams();
    const url = searchParams?.get("url");
    const title = searchParams?.get("title") || "Recording";
    const batch = searchParams?.get("batch") || "";

    if (!url) {
        return (
            <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f0f2f5] p-5">
                <PlayCircle className="h-16 w-16 text-[#a3a3a3] mb-4" />
                <h1 className="text-xl font-bold text-[#212121]">Invalid Recording Link</h1>
                <p className="text-[#737373] mt-2 mb-6">No media URL was found for this recording.</p>
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

            {/* Video Player */}
            <div className="flex flex-1 items-center justify-center">
                <video
                    src={url}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full max-h-[calc(100vh-80px)] object-contain"
                >
                    Your browser does not support the video tag.
                </video>
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
