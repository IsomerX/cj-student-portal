import { isAxiosError } from "axios";

import { apiClient } from "@/lib/api/config";

export type DoubtStatus =
  | "OPEN"
  | "AI_DRAFTED"
  | "AWAITING_TEACHER"
  | "VERIFIED"
  | "AWAITING_FEEDBACK"
  | "RESOLVED"
  | "ESCALATED"
  | "CLOSED";

export interface DoubtSubject {
  id: string;
  name: string;
  code?: string | null;
}

export interface DoubtTeacher {
  id: string;
  name: string;
  email?: string;
  profilePic?: string | null;
}

export interface DoubtStudent {
  id: string;
  name: string;
  profilePic?: string | null;
}

export interface DoubtItem {
  id: string;
  title: string;
  description?: string | null;
  status: DoubtStatus | string;
  createdAt: string;
  updatedAt?: string;
  subject?: DoubtSubject | null;
  detectedTopic?: string | null;
  detectedDifficulty?: string | null;
  aiConfidence?: number | null;
  aiDraftAnswer?: string | null;
  verifiedAnswer?: string | null;
  viewCount?: number | null;
  isPublic?: boolean;
  attachmentUrls?: string[];
  assignedTeacher?: DoubtTeacher | null;
  student?: DoubtStudent | null;
}

export interface DoubtDetail extends DoubtItem {
  source?: "TEXT" | "IMAGE" | "VOICE" | string;
  creditCost?: number | null;
  studentRating?: number | null;
  studentFeedback?: string | null;
  verifiedAt?: string | null;
  resolvedAt?: string | null;
  verifiedByTeacher?: DoubtTeacher | null;
}

export interface DoubtMessageSender {
  id: string;
  name: string;
  profilePic?: string | null;
}

export interface DoubtMessage {
  id: string;
  content: string;
  senderType: "STUDENT" | "TEACHER" | "AI" | "SYSTEM" | string;
  createdAt: string;
  updatedAt?: string;
  attachmentUrls?: string[];
  sender?: DoubtMessageSender | null;
}

export interface MyDoubtsResult {
  doubts: DoubtItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DoubtFeedResult {
  doubts: DoubtItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface SimilarDoubt {
  id: string;
  title: string;
  similarity: number;
  verifiedAnswer: string | null;
  aiDraftAnswer: string | null;
  status: DoubtStatus | string;
}

export interface CreateDoubtPayload {
  title: string;
  description: string;
  subjectId: string;
  source?: "TEXT" | "IMAGE" | "VOICE";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  attachmentUrls?: string[];
  isPublic?: boolean;
}

export interface FetchMyDoubtsParams {
  status?: string;
  subjectId?: string;
  page?: number;
  limit?: number;
}

export interface AddDoubtMessagePayload {
  content?: string;
  attachmentUrls?: string[];
}

export interface RateDoubtPayload {
  rating: number;
  feedback?: string;
}

export interface FetchDoubtFeedParams {
  status?: string;
  subjectId?: string;
  cursor?: string;
  limit?: number;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

type QueryParamValue = string | number | undefined;

export class DoubtsApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "DoubtsApiError";
    this.status = status;
  }
}

function toDoubtsApiError(error: unknown): DoubtsApiError {
  if (error instanceof DoubtsApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const responseBody = (error.response?.data ?? {}) as ApiEnvelope<unknown>;
    return new DoubtsApiError(
      responseBody.error || responseBody.message || error.message || "Doubt request failed.",
      error.response?.status ?? null,
    );
  }

  if (error instanceof Error) {
    return new DoubtsApiError(error.message);
  }

  return new DoubtsApiError("Doubt request failed.");
}

function buildQueryString<T extends object>(params: T) {
  const queryString = new URLSearchParams(
    Object.entries(params as Record<string, QueryParamValue>)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  return queryString ? `?${queryString}` : "";
}

export async function fetchDoubtSubjects(classSectionId?: string): Promise<DoubtSubject[]> {
  try {
    const queryString = buildQueryString({ classSectionId });
    const response = await apiClient.get<ApiEnvelope<DoubtSubject[]>>(
      `/teacher-management/subjects${queryString}`,
    );

    return response.data.data ?? [];
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function fetchDoubtFeed(
  params: FetchDoubtFeedParams = {},
): Promise<DoubtFeedResult> {
  try {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiEnvelope<DoubtFeedResult>>(
      `/doubts/feed${queryString}`,
    );

    if (!response.data.data) {
      throw new DoubtsApiError("Doubt feed data could not be loaded.");
    }

    return response.data.data;
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function fetchMyDoubts(
  params: FetchMyDoubtsParams = {},
): Promise<MyDoubtsResult> {
  try {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiEnvelope<MyDoubtsResult>>(`/doubts${queryString}`);

    if (!response.data.data) {
      throw new DoubtsApiError("My doubts data could not be loaded.");
    }

    return response.data.data;
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function fetchSimilarDoubts(text: string): Promise<SimilarDoubt[]> {
  try {
    const response = await apiClient.post<ApiEnvelope<SimilarDoubt[]>>("/doubts/check-similar", {
      text,
    });

    return response.data.data ?? [];
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function fetchDoubtById(doubtId: string): Promise<DoubtDetail> {
  try {
    const response = await apiClient.get<ApiEnvelope<DoubtDetail>>(`/doubts/${doubtId}`);

    if (!response.data.data) {
      throw new DoubtsApiError("Doubt details could not be loaded.");
    }

    return response.data.data;
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function fetchDoubtMessages(doubtId: string): Promise<DoubtMessage[]> {
  try {
    const response = await apiClient.get<ApiEnvelope<DoubtMessage[]>>(`/doubts/${doubtId}/messages`);

    return response.data.data ?? [];
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function fetchSimilarDoubtsById(doubtId: string): Promise<SimilarDoubt[]> {
  try {
    const response = await apiClient.get<ApiEnvelope<SimilarDoubt[]>>(`/doubts/${doubtId}/similar`);

    return response.data.data ?? [];
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function addDoubtMessage(
  doubtId: string,
  payload: AddDoubtMessagePayload,
): Promise<DoubtMessage> {
  try {
    const response = await apiClient.post<ApiEnvelope<DoubtMessage>>(
      `/doubts/${doubtId}/messages`,
      payload,
    );

    if (!response.data.data) {
      throw new DoubtsApiError("Message could not be sent.");
    }

    return response.data.data;
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function rateDoubt(
  doubtId: string,
  payload: RateDoubtPayload,
): Promise<DoubtDetail> {
  try {
    const response = await apiClient.post<ApiEnvelope<DoubtDetail>>(
      `/doubts/${doubtId}/rate`,
      payload,
    );

    if (!response.data.data) {
      throw new DoubtsApiError("Rating could not be submitted.");
    }

    return response.data.data;
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export async function createDoubt(payload: CreateDoubtPayload): Promise<DoubtItem> {
  try {
    const response = await apiClient.post<ApiEnvelope<DoubtItem>>("/doubts", payload);

    if (!response.data.data) {
      throw new DoubtsApiError("Doubt could not be created.");
    }

    return response.data.data;
  } catch (error) {
    throw toDoubtsApiError(error);
  }
}

export { toDoubtsApiError };
