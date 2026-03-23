import { isAxiosError } from "axios";

import { apiClient } from "@/lib/api/config";

export type AssignmentType =
  | "homework"
  | "project"
  | "quiz"
  | "presentation"
  | "lab_work"
  | "material"
  | "other";

export type StudentAssignmentStatus =
  | "pending"
  | "submitted"
  | "late"
  | "graded"
  | "overdue";

export type AssignmentBadgeStatus = StudentAssignmentStatus | "material";

export type AssignmentAttachmentType =
  | "pdf"
  | "image"
  | "voice_note"
  | "video"
  | "document";

export interface AssignmentAttachment {
  type: AssignmentAttachmentType | string;
  url: string;
  name: string;
  size?: number;
}

export interface AssignmentTeacher {
  id: string;
  name: string;
  email?: string;
}

export interface StudentSubmission {
  id: string;
  submitted: boolean;
  submittedAt?: string;
  isLate: boolean;
  marks?: number | null;
  feedback?: string | null;
  gradedAt?: string;
  revisionNumber?: number;
  content?: string;
  fileUrls?: string[];
  voiceNoteUrl?: string | null;
  voiceNoteDuration?: number | null;
  voiceFeedbackUrl?: string | null;
  voiceFeedbackDuration?: number | null;
  voiceFeedbacks?: Array<{ url: string; duration?: number | null }> | null;
  annotatedSheetUrls?: string[];
  gradedBy?: AssignmentTeacher | null;
}

export interface StudentAssignment {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  type: AssignmentType | string;
  subject: string;
  className?: string;
  classLabel?: string;
  grade?: number | null;
  section?: string | null;
  dueDate?: string | null;
  totalMarks: number;
  teacher?: AssignmentTeacher | null;
  attachments?: AssignmentAttachment[];
  voiceInstructions?: Array<{ url: string; duration?: number | null }> | null;
  voiceInstructionUrl?: string | null;
  answerKey?: Array<{ type?: string; url: string; name?: string; size?: number }>;
  answerKeyUrl?: string | null;
  submissionMode?: "student" | "teacher";
  submission?: StudentSubmission | null;
  status: StudentAssignmentStatus;
  daysRemaining: number;
  daysOverdue: number;
  canSubmit: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentDetail {
  assignment: StudentAssignment;
  submission: StudentSubmission | null;
  status: StudentAssignmentStatus;
  daysRemaining: number;
  daysOverdue: number;
  canSubmit: boolean;
  canResubmit: boolean;
}

export interface SubmitAssignmentPayload {
  content?: string;
  fileUrls?: string[];
}

export interface BatchInfo {
  id: string;
  name: string;
  classSectionId?: string | null;
  subject?: {
    id: string;
    name: string;
  } | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ClassroomAnnouncement {
  id: string;
  content: string;
  attachments?: AssignmentAttachment[];
  createdBy: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  classSectionId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassroomActivityLog {
  id: string;
  type: string;
  message: string;
  metadata?: {
    assignmentId?: string;
    assignmentTitle?: string;
    materialId?: string;
    materialName?: string;
    dueDate?: string;
    oldDueDate?: string;
    newDueDate?: string;
    type?: string;
  };
  createdBy: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  createdAt: string;
}

export type AssignmentNoticeItem =
  | (ClassroomAnnouncement & { feedType: "announcement" })
  | (ClassroomActivityLog & { feedType: "activity" });

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  count?: number;
  url?: string;
  message?: string;
  error?: string;
}

type QueryParamValue = string | number | undefined;

export class AssignmentsApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "AssignmentsApiError";
    this.status = status;
  }
}

function toAssignmentsApiError(error: unknown): AssignmentsApiError {
  if (error instanceof AssignmentsApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const responseBody = (error.response?.data ?? {}) as ApiEnvelope<unknown>;
    return new AssignmentsApiError(
      responseBody.error || responseBody.message || error.message || "Assignment request failed.",
      error.response?.status ?? null,
    );
  }

  if (error instanceof Error) {
    return new AssignmentsApiError(error.message);
  }

  return new AssignmentsApiError("Assignment request failed.");
}

function buildQueryString<T extends object>(params: T) {
  const queryString = new URLSearchParams(
    Object.entries(params as Record<string, QueryParamValue>)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  return queryString ? `?${queryString}` : "";
}

export async function fetchMyAssignments(
  filters: {
    status?: StudentAssignmentStatus;
    type?: AssignmentType;
    subject?: string;
  } = {},
): Promise<StudentAssignment[]> {
  try {
    const queryString = buildQueryString(filters);
    const response = await apiClient.get<ApiEnvelope<StudentAssignment[]>>(
      `/assignments/my${queryString}`,
    );

    return response.data ?? [];
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function fetchAssignmentDetail(assignmentId: string): Promise<AssignmentDetail> {
  try {
    const response = await apiClient.get<ApiEnvelope<AssignmentDetail>>(
      `/assignments/${assignmentId}/my-submission`,
    );

    if (!response.data) {
      throw new AssignmentsApiError("Assignment detail could not be loaded.");
    }

    return response.data;
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function submitAssignment(
  assignmentId: string,
  payload: SubmitAssignmentPayload,
): Promise<void> {
  try {
    await apiClient.post(`/assignments/${assignmentId}/submit`, {
      content: payload.content ?? "",
      fileUrls: payload.fileUrls ?? [],
    });
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function cancelAssignmentSubmission(assignmentId: string): Promise<void> {
  try {
    await apiClient.delete(`/assignments/${assignmentId}/cancel-submission`);
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function refreshAssignmentUrl(url: string): Promise<string> {
  try {
    const response = await apiClient.post<ApiEnvelope<never>>("/assignments/refresh-url", {
      url,
    });

    return response.data.url ?? url;
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function fetchMyBatches(): Promise<BatchInfo[]> {
  try {
    const response = await apiClient.get<ApiEnvelope<BatchInfo[]>>("/batches/my");
    return response.data ?? [];
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function fetchClassroomAnnouncements(
  classSectionId: string,
): Promise<ClassroomAnnouncement[]> {
  try {
    const response = await apiClient.get<ApiEnvelope<ClassroomAnnouncement[]>>(
      `/classes/${encodeURIComponent(classSectionId)}/announcements`,
    );

    return response.data ?? [];
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}

export async function fetchClassroomActivityLogs(
  classSectionId: string,
): Promise<ClassroomActivityLog[]> {
  try {
    const response = await apiClient.get<ApiEnvelope<ClassroomActivityLog[]>>(
      `/classes/${encodeURIComponent(classSectionId)}/activity-logs`,
    );

    return response.data ?? [];
  } catch (error) {
    throw toAssignmentsApiError(error);
  }
}
