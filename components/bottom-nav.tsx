"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BookOpen,
    Video,
    Brain,
    CircleHelp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Filled icons using exact lucide paths ───────────────────────────────────
// Each uses the same 24x24 viewBox and geometry as the lucide outline.
// The main shape path is filled; inner detail paths are either cut out (evenodd)
// or drawn with a contrasting stroke so the filled icon reads the same as outline.

function HomeFilled({ className }: { className?: string }) {
    // House body: exact lucide path. Door: closed version of lucide door path.
    // evenodd cuts the door out of the house body.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 21v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8H9z"
            />
        </svg>
    );
}

function BookFilled({ className }: { className?: string }) {
    // Exact lucide book-open body path, filled. Spine drawn as a subtle line.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
            <path
                d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
                fill="currentColor"
            />
            <path d="M12 7v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
        </svg>
    );
}

function VideoFilled({ className }: { className?: string }) {
    // Exact lucide video: rect body + lens path, both filled.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5z" />
        </svg>
    );
}

function BrainFilled({ className }: { className?: string }) {
    // Lucide brain has many stroke segments. For filled: draw the two outer
    // hemisphere silhouette paths (derived from the lucide arcs) as filled shapes,
    // then overlay the stem and wrinkle detail as subtle strokes.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
            {/* Left hemisphere outline → filled */}
            <path
                d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"
                fill="currentColor"
            />
            <path
                d="M6.003 5.125a4 4 0 0 0-2.526 5.77"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"
            />
            <path
                d="M17.997 5.125a4 4 0 0 1 2.526 5.77"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"
            />
            <path
                d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"
                fill="currentColor"
            />
            <path d="M6 18a4 4 0 0 1-2-7.464" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 18a4 4 0 0 0 2-7.464" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Stem */}
            <path d="M12 18V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            {/* Wrinkle */}
            <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
        </svg>
    );
}

function CircleHelpFilled({ className }: { className?: string }) {
    // Filled circle with ? and dot masked out so the background shows through.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
            <defs>
                <mask id="bn-help-mask">
                    <rect width="24" height="24" fill="white" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="black" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <circle cx="12" cy="17" r="1.25" fill="black" />
                </mask>
            </defs>
            <circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#bn-help-mask)" />
        </svg>
    );
}

// ─── Nav config ──────────────────────────────────────────────────────────────

const FILLED_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
    "/dashboard": HomeFilled,
    "/assignments": BookFilled,
    "/live": VideoFilled,
    "/ai": BrainFilled,
    "/doubts": CircleHelpFilled,
};

type NavItem = {
    href: string;
    icon: LucideIcon;
    label: string;
};

const NAV_ITEMS: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/assignments", icon: BookOpen, label: "Work" },
    { href: "/live", icon: Video, label: "Live" },
    { href: "/ai", icon: Brain, label: "Dost AI" },
    { href: "/doubts", icon: CircleHelp, label: "Doubts" },
];

const HIDDEN_PATHS = ["/login", "/auth"];

function isHiddenPath(pathname: string): boolean {
    if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return true;
    if (/^\/live\/[^/]+$/.test(pathname)) return true;
    return false;
}

function isActive(pathname: string, href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BottomNav() {
    const pathname = usePathname();

    if (isHiddenPath(pathname)) return null;

    return (
        <nav className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0 rounded-full border border-white/20 bg-[#283618]/95 px-2 py-1.5 shadow-xl backdrop-blur-md sm:hidden">
            {NAV_ITEMS.map(({ href, icon: OutlineIcon, label }) => {
                const active = isActive(pathname, href);
                const FilledIcon = FILLED_ICONS[href];

                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex flex-col items-center gap-0.5 rounded-full px-2.5 py-1 transition-colors ${
                            active
                                ? "text-white"
                                : "text-white/45 hover:text-white/70"
                        }`}
                    >
                        {active && FilledIcon ? (
                            <FilledIcon className="h-[22px] w-[22px]" />
                        ) : (
                            <OutlineIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                        )}
                        <span
                            className={`text-[9px] whitespace-nowrap ${
                                active ? "font-bold" : "font-medium"
                            }`}
                        >
                            {label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
