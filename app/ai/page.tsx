"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    Brain,
    Home,
    LogOut,
    RefreshCw,
    Search,
    User,
    Video,
    Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogoutMutation } from "@/hooks/use-auth";
import { useNotebooksQuery } from "@/hooks/use-notebooks";
import { useAiCreditsQuery } from "@/hooks/use-ai-credits";

export default function AILearningPage() {
    const router = useRouter();
    const logoutMutation = useLogoutMutation();

    const {
        data: notebooksData,
        isLoading: isNotebooksLoading,
        error: notebooksError,
        refetch: refetchNotebooks,
    } = useNotebooksQuery("ACTIVE");

    const { data: creditsData } = useAiCreditsQuery();

    const [searchQuery, setSearchQuery] = React.useState("");

    const notebooks = React.useMemo(() => notebooksData?.data?.notebooks || [], [notebooksData?.data?.notebooks]);
    const baseCredits = creditsData?.data?.baseCreditsRemaining || 0;

    // Filter notebooks by search query
    const filteredNotebooks = React.useMemo(() => {
        if (!searchQuery.trim()) return notebooks;
        const query = searchQuery.toLowerCase();
        return notebooks.filter(
            (n) =>
                n.title.toLowerCase().includes(query) ||
                n.description?.toLowerCase().includes(query) ||
                n.subject?.toLowerCase().includes(query) ||
                n.tags?.some((t) => t.toLowerCase().includes(query))
        );
    }, [notebooks, searchQuery]);

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            router.push("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    if (isNotebooksLoading) {
        return (
            <main className="min-h-[100dvh] bg-[#f0f2f5] pb-20 sm:pb-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Brain className="h-10 w-10 text-[#c4a57b]" />
                    <p className="text-[#767676] font-medium text-sm">Loading Dost AI...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-[#f0f2f5] pb-24 sm:pb-12 relative">
            {/* Dark Header Section (Matches Dashboard) */}
            <section className="relative px-4 pb-24 pt-6 sm:px-6 sm:pb-32 sm:pt-8 lg:px-8 lg:pb-36 lg:pt-10 bg-[#283618] rounded-b-[32px] sm:rounded-b-[40px] shadow-lg overflow-hidden">
                {/* Decorative background blobs for depth */}
                <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#cadab2]/10 blur-3xl lg:translate-x-1/4" />

                <div className="relative mx-auto max-w-6xl">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[14px] sm:rounded-[16px] bg-white text-[#283618] shadow-sm ring-2 ring-white/10 transition-transform duration-300 hover:scale-105">
                                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                                    Learning Hub
                                </p>
                                <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white lg:text-2xl">Dost AI</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
                            {/* Desktop Logout Button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                disabled={logoutMutation.isPending}
                                className="hidden sm:inline-flex shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md rounded-[12px] h-9 px-3 transition-all duration-300 hover:scale-105 border-0 focus:ring-2 focus:ring-white/50"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-10 max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#cadab2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#283618] shadow-sm">
                            <Zap className="h-3 w-3" fill="currentColor" />
                            {baseCredits} Credits Available
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-extrabold leading-tight tracking-tight text-white lg:text-[2.75rem]">
                                All your <span className="text-[#cadab2]">notebooks</span>.
                            </h1>
                            <p className="text-sm sm:text-base font-medium leading-relaxed text-white/80">
                                Access your generated summaries, mind maps, and chat discussions here.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Overlapping Main Content Area */}
            <div className="relative z-10 -mt-16 sm:-mt-20 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full pb-20">
                {/* Search Bar - Lifted onto Header slightly */}
                <div className="mb-6">
                    <div className="relative max-w-lg mx-auto sm:mx-0 shadow-sm transition-shadow focus-within:shadow-md rounded-[16px]">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a3a3a3]" />
                        <Input
                            type="search"
                            placeholder="Search notebook titles or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 rounded-[16px] border-2 border-[#ece5c8] bg-white focus-visible:ring-[#cadab2] focus-visible:border-[#cadab2] text-base"
                        />
                    </div>
                </div>

                {notebooksError ? (
                    <div className="flex flex-col items-center justify-center p-8 mt-10 rounded-[24px] border border-dashed border-[#ece5c8] bg-white">
                        <span className="text-4xl mb-4">⚠️</span>
                        <p className="text-lg font-bold text-[#dc2626] mb-2">Unable to Load Notebooks</p>
                        <p className="text-sm text-[#737373] text-center max-w-sm mb-6">
                            {notebooksError instanceof Error ? notebooksError.message : "An error occurred fetching your notebooks."}
                        </p>
                        <Button onClick={() => refetchNotebooks()} className="rounded-[12px] bg-[#414141] text-white hover:bg-[#212121]">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                ) : filteredNotebooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredNotebooks.map((notebook) => (
                            <Link
                                key={notebook.id}
                                href={`/ai/notebook/${notebook.id}`}
                                className="group flex flex-col rounded-[20px] border-2 border-[#ece5c8] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c4a57b]/40 hover:shadow-md"
                            >
                                <div className="flex items-start mb-3">
                                    <div
                                        className="w-1.5 h-12 rounded-full mr-3 shrink-0"
                                        style={{ backgroundColor: notebook.coverColor || "#c4a57b" }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-[#212121] truncate leading-tight">
                                            {notebook.title}
                                        </h3>
                                        {notebook.subject && (
                                            <div className="mt-1.5 inline-flex rounded-md border border-[#ece5c8] bg-[#faf8ef] px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-[#775f32]">
                                                {notebook.subject}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {notebook.description && (
                                    <p className="text-sm text-[#737373] leading-relaxed line-clamp-3 mb-4 flex-1">
                                        {notebook.description}
                                    </p>
                                )}

                                {notebook.tags && notebook.tags.length > 0 && (
                                    <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-[#ece5c8]/50">
                                        {notebook.tags.slice(0, 3).map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="rounded-md border border-[#c4a57b]/30 bg-[#c4a57b]/5 px-2 py-0.5 text-[10px] font-semibold text-[#8a7250]"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                        {notebook.tags.length > 3 && (
                                            <span className="rounded-md border border-[#ece5c8] bg-[#fdfcfa] px-2 py-0.5 text-[10px] font-semibold text-[#a3a3a3]">
                                                +{notebook.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 mt-10 rounded-[24px] border border-dashed border-[#ece5c8] bg-white">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#faf8ef] border-2 border-[#ece5c8] shadow-sm mb-6">
                            <BookOpen className="h-10 w-10 text-[#a3a3a3]" />
                        </div>
                        <p className="text-xl font-bold text-[#212121] mb-2 text-center">
                            {searchQuery ? "No notebooks found" : "No Notebooks Yet"}
                        </p>
                        <p className="text-sm text-[#737373] text-center max-w-[260px]">
                            {searchQuery
                                ? "Try adjusting your search terms."
                                : "Create your first notebook to start learning with AI."}
                        </p>
                    </div>
                )}
            </div>



            {/* Persistent Bottom Nav (Mobile Only) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#ece5c8] bg-white/90 px-2 pb-safe pt-2 backdrop-blur-lg sm:hidden">
                <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
                        <Home className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/ai" className="flex flex-col items-center gap-1 p-2 text-[#283618]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef7e6]">
                        <Brain className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold">Dost AI</span>
                </Link>
                <Link href="/live" className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
                        <Video className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium">Live</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
                        <User className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </nav>
        </main>
    );
}
