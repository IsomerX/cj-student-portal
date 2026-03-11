"use client";

import dynamic from "next/dynamic";
import { HMSRoomProvider } from "@100mslive/react-sdk";

const LiveSessionClient = dynamic(() => import("./LiveSessionClient"), {
    ssr: false,
});

export default function LiveSessionDynamicWrapper() {
    return (
        <HMSRoomProvider>
            <LiveSessionClient />
        </HMSRoomProvider>
    );
}
