"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addDoubtMessage,
  createDoubt,
  fetchDoubtById,
  fetchDoubtFeed,
  fetchDoubtMessages,
  fetchDoubtSubjects,
  fetchMyDoubts,
  fetchSimilarDoubtsById,
  fetchSimilarDoubts,
  rateDoubt,
  type AddDoubtMessagePayload,
  type CreateDoubtPayload,
  type DoubtMessage,
  type FetchDoubtFeedParams,
  type FetchMyDoubtsParams,
  type RateDoubtPayload,
} from "@/lib/api/doubts";
import { getStoredToken } from "@/lib/auth/storage";
import { doubtQueryKeys } from "@/lib/query-keys";

export function useDoubtSubjectsQuery(classSectionId?: string) {
  const token = getStoredToken();

  return useQuery({
    queryKey: doubtQueryKeys.subjects(classSectionId),
    queryFn: () => fetchDoubtSubjects(classSectionId),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDoubtFeedQuery(filters: FetchDoubtFeedParams) {
  const token = getStoredToken();

  return useQuery({
    queryKey: doubtQueryKeys.feed(filters),
    queryFn: () => fetchDoubtFeed(filters),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useMyDoubtsQuery(filters: FetchMyDoubtsParams) {
  const token = getStoredToken();

  return useQuery({
    queryKey: doubtQueryKeys.mine(filters),
    queryFn: () => fetchMyDoubts(filters),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useDoubtDetailQuery(doubtId?: string) {
  const token = getStoredToken();

  return useQuery({
    queryKey: doubtQueryKeys.detail(doubtId ?? ""),
    queryFn: () => fetchDoubtById(doubtId ?? ""),
    enabled: Boolean(token) && Boolean(doubtId),
    staleTime: 30 * 1000,
  });
}

export function useDoubtMessagesQuery(
  doubtId?: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const token = getStoredToken();

  return useQuery({
    queryKey: doubtQueryKeys.messages(doubtId ?? ""),
    queryFn: () => fetchDoubtMessages(doubtId ?? ""),
    enabled: Boolean(token) && Boolean(doubtId) && (options?.enabled ?? true),
    staleTime: 10 * 1000,
    refetchInterval: options?.refetchInterval,
  });
}

export function useSimilarDoubtsByIdQuery(doubtId?: string) {
  const token = getStoredToken();

  return useQuery({
    queryKey: doubtQueryKeys.related(doubtId ?? ""),
    queryFn: () => fetchSimilarDoubtsById(doubtId ?? ""),
    enabled: Boolean(token) && Boolean(doubtId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSimilarDoubtsQuery(text: string) {
  const token = getStoredToken();
  const normalized = text.trim();

  return useQuery({
    queryKey: doubtQueryKeys.similar(normalized),
    queryFn: () => fetchSimilarDoubts(normalized),
    enabled: Boolean(token) && normalized.length >= 20,
    staleTime: 30 * 1000,
  });
}

export function useCreateDoubtMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDoubtPayload) => createDoubt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doubtQueryKeys.all });
    },
  });
}

export function useAddDoubtMessageMutation(doubtId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddDoubtMessagePayload) => addDoubtMessage(doubtId, payload),
    onSuccess: (message) => {
      queryClient.setQueryData(
        doubtQueryKeys.messages(doubtId),
        (current: DoubtMessage[] | undefined) => {
          if (!current) {
            return [message];
          }

          return [...current, message];
        },
      );
      queryClient.invalidateQueries({ queryKey: doubtQueryKeys.detail(doubtId) });
    },
  });
}

export function useRateDoubtMutation(doubtId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RateDoubtPayload) => rateDoubt(doubtId, payload),
    onSuccess: (updatedDoubt) => {
      queryClient.setQueryData(doubtQueryKeys.detail(doubtId), updatedDoubt);
      queryClient.invalidateQueries({ queryKey: doubtQueryKeys.all });
    },
  });
}
