import type { Viewport } from "next";
import { Suspense } from "react";
import LiveSessionDynamicWrapper from "./LiveSessionDynamicWrapper";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function Page() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fffbe7] p-5">
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="h-16 w-16 rounded-full border-4 border-[#e5e5e5] border-t-[#414141] animate-spin mb-6" />
                        <p className="text-lg font-bold text-[#414141]">Loading...</p>
                    </div>
                </main>
            }
        >
            <LiveSessionDynamicWrapper />
        </Suspense>
    );
}
