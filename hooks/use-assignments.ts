"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelAssignmentSubmission,
  fetchAssignmentDetail,
  fetchClassroomActivityLogs,
  fetchClassroomAnnouncements,
  fetchMyAssignments,
  fetchMyBatches,
  submitAssignment,
  type AssignmentDetail,
  type AssignmentNoticeItem,
  type AssignmentType,
  type StudentAssignment,
  type StudentAssignmentStatus,
  type SubmitAssignmentPayload,
} from "@/lib/api/assignments";
import { getStoredToken } from "@/lib/auth/storage";

const assignmentQueryKeys = {
  all: ["assignments"] as const,
  list: (filters: { status?: StudentAssignmentStatus; type?: AssignmentType; subject?: string }) =>
    [...assignmentQueryKeys.all, "list", filters] as const,
  detail: (assignmentId: string) => [...assignmentQueryKeys.all, "detail", assignmentId] as const,
  notices: (classSectionIds: string[]) =>
    [...assignmentQueryKeys.all, "notices", [...classSectionIds].sort()] as const,
  batches: () => [...assignmentQueryKeys.all, "batches"] as const,
};

function dedupeAndSortNotices(items: AssignmentNoticeItem[]) {
  return [...items]
    .filter((item, index, current) => {
      const key = `${item.feedType}:${item.id}`;
      return (
        index ===
        current.findIndex((candidate) => `${candidate.feedType}:${candidate.id}` === key)
      );
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

export function useMyAssignmentsQuery(filters: {
  status?: StudentAssignmentStatus;
  type?: AssignmentType;
  subject?: string;
}) {
  const token = getStoredToken();

  return useQuery<StudentAssignment[]>({
    queryKey: assignmentQueryKeys.list(filters),
    queryFn: () => fetchMyAssignments(filters),
    enabled: Boolean(token),
    staleTime: 30 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export function useAssignmentDetailQuery(assignmentId?: string) {
  const token = getStoredToken();

  return useQuery<AssignmentDetail>({
    queryKey: assignmentQueryKeys.detail(assignmentId ?? ""),
    queryFn: () => fetchAssignmentDetail(assignmentId ?? ""),
    enabled: Boolean(token) && Boolean(assignmentId),
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export function useMyBatchesQuery() {
  const token = getStoredToken();

  return useQuery({
    queryKey: assignmentQueryKeys.batches(),
    queryFn: fetchMyBatches,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignmentNoticesQuery(classSectionIds: string[]) {
  const token = getStoredToken();
  const normalizedIds = [...new Set(classSectionIds.filter(Boolean))];

  return useQuery({
    queryKey: assignmentQueryKeys.notices(normalizedIds),
    queryFn: async () => {
      const perClassNotices = await Promise.all(
        normalizedIds.map(async (classSectionId) => {
          const [announcements, activityLogs] = await Promise.all([
            fetchClassroomAnnouncements(classSectionId),
            fetchClassroomActivityLogs(classSectionId),
          ]);

          return [
            ...announcements.map(
              (announcement) =>
                ({
                  ...announcement,
                  feedType: "announcement",
                }) as AssignmentNoticeItem,
            ),
            ...activityLogs.map(
              (activity) =>
                ({
                  ...activity,
                  feedType: "activity",
                }) as AssignmentNoticeItem,
            ),
          ];
        }),
      );

      return dedupeAndSortNotices(perClassNotices.flat());
    },
    enabled: Boolean(token) && normalizedIds.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export function useSubmitAssignmentMutation(assignmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitAssignmentPayload) => submitAssignment(assignmentId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.detail(assignmentId) }),
      ]);
    },
  });
}

export function useCancelAssignmentSubmissionMutation(assignmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelAssignmentSubmission(assignmentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.detail(assignmentId) }),
      ]);
    },
  });
}

export { assignmentQueryKeys };
