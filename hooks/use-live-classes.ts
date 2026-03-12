"use client";

import { useQuery } from "@tanstack/react-query";

import {
    fetchMyLiveClasses,
    fetchLiveClassToken,
    fetchRecordingsByBatch,
} from "@/lib/api/live-classes";
import { getStoredToken } from "@/lib/auth/storage";
import { liveClassQueryKeys } from "@/lib/query-keys";

export function useLiveClassesQuery() {
    const token = getStoredToken();

    return useQuery({
        queryKey: liveClassQueryKeys.list(),
        queryFn: () => fetchMyLiveClasses(),
        enabled: Boolean(token),
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

export function useRecordingsQuery(batchIds: string[]) {
    const token = getStoredToken();

    return useQuery({
        queryKey: [...liveClassQueryKeys.recordings(), batchIds],
        queryFn: async () => {
            if (batchIds.length === 0) return [];

            const results = await Promise.allSettled(
                batchIds.map((id) => fetchRecordingsByBatch(id))
            );

            const allRecordings: any[] = [];
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
        enabled: Boolean(token) && batchIds.length > 0,
    });
}
