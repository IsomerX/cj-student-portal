"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarCheck2,
  FileText,
  GraduationCap,
  LogOut,
  Sparkles,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPill } from "@/components/ui/filter-pill";
import { clearSession, getStoredToken } from "@/lib/auth/storage";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";

const moduleCards = [
  {
    title: "Attendance",
    description: "Daily presence, history, and leave records.",
    icon: <CalendarCheck2 className="h-5 w-5" />,
  },
  {
    title: "Assignments",
    description: "Pending work, materials, and submissions.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Exams",
    description: "Exam records, results, and performance snapshots.",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    title: "Live Classes",
    description: "Schedules, waiting room, and join flow.",
    icon: <Video className="h-5 w-5" />,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const logoutMutation = useLogoutMutation();

  React.useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  React.useEffect(() => {
    if (profileQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [profileQuery.isError, router]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  if (!token) {
    return null;
  }

  if (profileQuery.isLoading) {
    return (
      <main className="min-h-screen bg-[#fff7eb] p-4 md:p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-40 rounded-[28px] border border-[#ece5c8] bg-white" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 rounded-2xl border border-[#ece5c8] bg-white" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const user = profileQuery.data;

  return (
    <main className="min-h-screen bg-[#fff7eb] p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-[#ece5c8] bg-gradient-to-br from-white via-[#fffaf0] to-[#f6f3e6] p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#283618]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#283618]">
                <Sparkles className="h-3.5 w-3.5" />
                Auth verified
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#414141] md:text-4xl">
                Welcome, {user?.name || "student"}.
              </h1>
              <p className="text-sm leading-6 text-[#737373] md:text-base">
                The login flow is now live against `backend_main`, and this dashboard placeholder
                is already powered by the authenticated profile query.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {user?.role ? <FilterPill selected>{user.role}</FilterPill> : null}
                {user?.school?.name ? (
                  <FilterPill tone="neutral" selected>
                    {user.school.name}
                  </FilterPill>
                ) : null}
                {user?.classSection?.grade != null ? (
                  <FilterPill tone="neutral" selected>
                    Class {user.classSection.grade}
                    {user.classSection.section ? user.classSection.section : ""}
                  </FilterPill>
                ) : null}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {moduleCards.map((module) => (
            <Card key={module.title}>
              <CardHeader>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#283618]/10 text-[#283618]">
                  {module.icon}
                </div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-[#283618]">
                  <BookOpen className="h-4 w-4" />
                  Module build comes next
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
