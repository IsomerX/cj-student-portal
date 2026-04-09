"use client";

import { useQuery } from "@tanstack/react-query";

import {
    fetchMyLiveClasses,
    fetchLiveClassToken,
    fetchDayPassVideoToken,
    fetchRecordingsByBatch,
    type Recording,
} from "@/lib/api/live-classes";
import { getStoredToken } from "@/lib/auth/storage";
import { liveClassQueryKeys } from "@/lib/query-keys";

export function useLiveClassesQuery() {
    const token = getStoredToken();

    return useQuery({
        queryKey: liveClassQueryKeys.list(),
        queryFn: () => fetchMyLiveClasses(),
        enabled: Boolean(token),
        staleTime: 10 * 1000,
        refetchInterval: 15 * 1000,
        refetchIntervalInBackground: true,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
}

export function useLiveClassTokenQuery(classId: string, enabled: boolean = true) {
    const token = getStoredToken();

    return useQuery({
        queryKey: liveClassQueryKeys.token(classId),
        queryFn: () => fetchLiveClassToken(classId),
        enabled: Boolean(token) && Boolean(classId) && enabled,
        // Auth tokens must never be served from cache — always fetch fresh
        gcTime: 0,
        staleTime: 0,
        // Handled manually by component for 403
        retry: false,
    });
}

export function useDayPassVideoTokenQuery(dayPassToken: string | null, enabled: boolean = true) {
    return useQuery({
        queryKey: ['day-pass-video-token', dayPassToken],
        queryFn: () => fetchDayPassVideoToken(dayPassToken!),
        enabled: Boolean(dayPassToken) && enabled,
        gcTime: 0,
        staleTime: 0,
        retry: false,
    });
}

export function useRecordingsQuery(batchIds: string[]) {
    const token = getStoredToken();
    const normalizedBatchIds = [...new Set(batchIds.filter(Boolean))].sort();

    return useQuery({
        queryKey: [...liveClassQueryKeys.recordings(), normalizedBatchIds],
        queryFn: async () => {
            if (normalizedBatchIds.length === 0) return [];

            const results = await Promise.allSettled(
                normalizedBatchIds.map((id) => fetchRecordingsByBatch(id))
            );

            const allRecordings: Recording[] = [];
            const seenIds = new Set<string>();

            for (const result of results) {
                if (result.status === "fulfilled") {
                    for (const rec of result.value) {
                        if (!seenIds.has(rec.id)) {
                            seenIds.add(rec.id);
                            allRecordings.push(rec);
                        }
                    }
                }
            }

            allRecordings.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            return allRecordings;
        },
        enabled: Boolean(token) && normalizedBatchIds.length > 0,
        staleTime: 15 * 1000,
        refetchInterval: 30 * 1000,
        refetchOnWindowFocus: true,
    });
}
