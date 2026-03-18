"use client";

import dynamic from "next/dynamic";
import { VideoProvider } from "@/hooks/video-provider";

const LiveSessionClient = dynamic(() => import("./LiveSessionClient"), {
    ssr: false,
});

export default function LiveSessionDynamicWrapper() {
    return (
        <VideoProvider>
            <LiveSessionClient />
        </VideoProvider>
    );
}
