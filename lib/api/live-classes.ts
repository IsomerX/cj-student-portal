import { isAxiosError } from "axios";

import { apiClient } from "@/lib/api/config";

export type LiveClassStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";

export interface LiveClass {
    id: string;
    title: string;
    batchId: string;
    batch: { id: string; name: string; schoolId: string };
    hostId: string;
    host: { id: string; name: string; email: string };
    startAt: string;
    endAt?: string | null;
    duration?: number | null;
    status: LiveClassStatus;
    hmsRoomId?: string | null;
    waitingRoom: boolean;
    autoRecord: boolean;
    isRecurring: boolean;
    recurringDays: number[];
    _count: { attendance: number; invites: number };
    createdAt: string;
}

export interface AuthTokenResponse {
    token: string;
    role: string;
    roomId: string;
}

export type RecordingStatus = "RECORDING" | "PROCESSING" | "READY" | "FAILED";

export interface Recording {
    id: string;
    url: string;
    duration?: number | null;
    size?: number | null;
    status: RecordingStatus;
    drmStatus?: 'saving' | 'encrypting' | 'ready';
    downloadEnabled: boolean;
    liveClass: { title: string; startAt: string; batch: { name: string } };
    _count: { accessGrants: number };
    hasAccess?: boolean;
    createdAt: string;
}

interface ApiEnvelope<T> {
    success?: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export class LiveClassesApiError extends Error {
    status: number | null;

    constructor(message: string, status: number | null = null) {
        super(message);
        this.name = "LiveClassesApiError";
        this.status = status;
    }
}

export function toLiveClassesApiError(error: unknown): LiveClassesApiError {
    if (error instanceof LiveClassesApiError) {
        return error;
    }

    if (isAxiosError(error)) {
        const responseBody = (error.response?.data ?? {}) as ApiEnvelope<unknown>;
        return new LiveClassesApiError(
            responseBody.error || responseBody.message || error.message || "Live classes request failed.",
            error.response?.status ?? null,
        );
    }

    if (error instanceof Error) {
        return new LiveClassesApiError(error.message);
    }

    return new LiveClassesApiError("Live classes request failed.");
}

export async function fetchMyLiveClasses(
    params?: { status?: string; batchId?: string }
): Promise<LiveClass[]> {
    try {
        const queryString = new URLSearchParams();
        if (params?.status) queryString.append("status", params.status);
        if (params?.batchId) queryString.append("batchId", params.batchId);

        const query = queryString.toString();
        const url = `/live-classes/my-classes${query ? `?${query}` : ""}`;

        const response = await apiClient.get<ApiEnvelope<LiveClass[]>>(url);

        if (response.data.success === false) {
            throw new LiveClassesApiError(response.data.message || "Failed to fetch live classes.");
        }

        return response.data.data ?? [];
    } catch (error) {
        throw toLiveClassesApiError(error);
    }
}

export async function fetchLiveClassToken(classId: string): Promise<AuthTokenResponse> {
    try {
        const response = await apiClient.get<ApiEnvelope<AuthTokenResponse>>(
            `/live-classes/${classId}/token`
        );

        if (response.data.success === false) {
            throw new LiveClassesApiError(response.data.message || "Failed to get class token.");
        }

        if (!response.data.data) {
            throw new LiveClassesApiError("Empty token data.");
        }

        return response.data.data;
    } catch (error) {
        throw toLiveClassesApiError(error);
    }
}

export async function joinLiveClass(classId: string): Promise<void> {
    try {
        const response = await apiClient.post<ApiEnvelope<any>>(`/live-classes/${classId}/join`);

        if (response.data.success === false) {
            throw new LiveClassesApiError(response.data.message || "Failed to join class.");
        }
    } catch (error) {
        throw toLiveClassesApiError(error);
    }
}

export async function fetchPlaybackOtp(recordingId: string): Promise<{ otp?: string; playbackInfo?: string; fallback?: boolean; url?: string; processing?: boolean; vdoStatus?: string }> {
    try {
        const response = await apiClient.post<ApiEnvelope<{ otp?: string; playbackInfo?: string; fallback?: boolean; url?: string }>>(
            `/recordings/${recordingId}/otp`
        );

        if (response.data.success === false) {
            throw new LiveClassesApiError(response.data.message || "Failed to get playback OTP.");
        }

        if (!response.data.data) {
            throw new LiveClassesApiError("Empty playback data.");
        }

        return response.data.data;
    } catch (error) {
        throw toLiveClassesApiError(error);
    }
}

export async function fetchRecordingsByBatch(batchId: string): Promise<Recording[]> {
    try {
        const response = await apiClient.get<ApiEnvelope<Recording[]>>(
            `/recordings/batch/${batchId}`
        );

        if (response.data.success === false) {
            throw new LiveClassesApiError(response.data.message || "Failed to fetch recordings.");
        }

        return response.data.data ?? [];
    } catch (error) {
        throw toLiveClassesApiError(error);
    }
}
