"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Home, Video, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/live", icon: Video, label: "Live" },
  { href: "/live/recordings", icon: Clapperboard, label: "Recordings" },
];

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

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/live") {
    return pathname === "/live";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const pathname = usePathname();

  if (isHiddenPath(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 items-center justify-center gap-1 rounded-full border border-white/20 bg-[#283618]/95 px-2 py-1.5 shadow-xl backdrop-blur-md sm:bottom-6 sm:w-auto sm:max-w-none sm:gap-2 sm:px-3 sm:py-2">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-[88px] items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all sm:min-w-[112px]",
              active
                ? "bg-white text-[#283618] shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
