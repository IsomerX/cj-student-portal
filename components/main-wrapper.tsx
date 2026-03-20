"use client";

import React from "react";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/login", "/auth"];

function isHiddenPath(pathname: string): boolean {
    if (HIDDEN_PATHS.some((path) => pathname.startsWith(path))) {
        return true;
    }
    if (/^\/live\/(?!recordings(?:\/|$))[^/]+$/.test(pathname)) {
        return true;
    }
    if (pathname.startsWith("/live/recordings/play")) {
        return true;
    }
    return false;
}

export default function MainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (isHiddenPath(pathname)) {
        return <>{children}</>;
    }

    return (
        <div className="md:pl-64 min-h-screen flex flex-col min-w-0">
            {children}
        </div>
    );
}
