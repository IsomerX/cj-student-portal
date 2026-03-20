"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Video,
    Clapperboard,
    LibraryBig,
    Sparkles,
    LogOut,
    GraduationCap
} from "lucide-react";
import { useLogoutMutation, useAuthProfileQuery } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/live", icon: Video, label: "Live Classes" },
    { href: "/live/recordings", icon: Clapperboard, label: "Recordings" },
    { href: "#", icon: LibraryBig, label: "Assignments", disabled: true },
    { href: "#", icon: Sparkles, label: "Dost AI", disabled: true },
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
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/live") return pathname === "/live";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const logoutMutation = useLogoutMutation();
    const profileQuery = useAuthProfileQuery();

    if (isHiddenPath(pathname)) {
        return null;
    }

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
        router.replace("/login");
    };

    const user = profileQuery.data;

    return (
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#283618] text-white z-50 border-r border-[#3a4e23] shadow-xl shadow-black/10">
            {/* Branding Header */}
            <div className="flex items-center gap-3 px-6 py-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#283618] shadow-sm">
                    <GraduationCap className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                        Student Portal
                    </p>
                    <p className="truncate text-lg font-extrabold tracking-tight text-white">
                        CJ Coaching
                    </p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col gap-2 px-4 py-4">
                {NAV_ITEMS.map(({ href, icon: Icon, label, disabled }) => {
                    const active = !disabled && isActive(pathname, href);

                    return (
                        <Link
                            key={label}
                            href={disabled ? "#" : href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                                disabled && "opacity-50 cursor-not-allowed",
                                active
                                    ? "bg-white text-[#283618] shadow-sm"
                                    : "text-white/80 hover:bg-white/10 hover:text-white"
                            )}
                            onClick={(e) => disabled && e.preventDefault()}
                        >
                            <Icon className={cn("h-5 w-5", active ? "text-[#283618]" : "text-white/70")} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Profile & Logout */}
            <div className="p-4 bg-black/10 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shadow-inner overflow-hidden">
                        {user?.profilePicUrl ? (
                            <img src={user.profilePicUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            user?.name ? user.name.charAt(0).toUpperCase() : "S"
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{user?.name || "Student"}</p>
                        <p className="truncate text-xs text-white/60">{user?.classSection?.grade ? `Class ${user.classSection.grade}` : "Welcome"}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                >
                    <LogOut className="h-5 w-5 text-white/70" />
                    {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </Button>
            </div>
        </aside>
    );
}
