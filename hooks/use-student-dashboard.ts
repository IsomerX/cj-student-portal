"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchStudentDashboard } from "@/lib/api/student-dashboard";
import { getStoredToken } from "@/lib/auth/storage";
import { dashboardQueryKeys } from "@/lib/query-keys";

export function useStudentDashboardQuery() {
  const token = getStoredToken();

  return useQuery({
    queryKey: dashboardQueryKeys.home(),
    queryFn: fetchStudentDashboard,
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}
