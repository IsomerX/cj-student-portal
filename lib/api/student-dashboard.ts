import { isAxiosError } from "axios";

import { apiClient } from "@/lib/api/config";

export type DashboardScheduleStatus = "completed" | "ongoing" | "upcoming";

export interface StudentDashboardPeriod {
  id: string;
  periodNumber: number;
  subject: string;
  startTime: string;
  endTime: string;
  time: string;
  teacher: string;
  isSubstitution: boolean;
  originalTeacher: string | null;
  room: string | null;
  status: DashboardScheduleStatus;
  minutesRemaining?: number;
  minutesUntilStart?: number;
}

export interface StudentDashboardAlert {
  id: string;
  type: string;
  subject?: string;
  message: string;
  time: string;
}

export interface StudentDashboardEvent {
  id: string;
  title: string;
  date: string;
  type?: string | null;
}

export interface StudentDashboardData {
  success?: boolean;
  timestamp: string;
  student: {
    id: string;
    name?: string | null;
    classSectionId?: string | null;
    classDisplay?: string | null;
  };
  today: {
    date: string;
    dayOfWeek: string;
    totalPeriods: number;
  };
  nextUp: {
    current: StudentDashboardPeriod | null;
    next: StudentDashboardPeriod | null;
    message: string;
  };
  schedule: StudentDashboardPeriod[];
  alerts: {
    count: number;
    items: StudentDashboardAlert[];
  };
  upcomingEvents: StudentDashboardEvent[];
  quickLinks?: {
    fullWeek?: string;
    attendance?: string;
    homework?: string;
  };
  message?: string;
}

export class StudentDashboardApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "StudentDashboardApiError";
    this.status = status;
  }
}

export function toStudentDashboardApiError(error: unknown): StudentDashboardApiError {
  if (error instanceof StudentDashboardApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const responseBody = (error.response?.data ?? {}) as { message?: string; error?: string };
    return new StudentDashboardApiError(
      responseBody.error ||
        responseBody.message ||
        error.message ||
        "Dashboard data could not be loaded.",
      error.response?.status ?? null,
    );
  }

  if (error instanceof Error) {
    return new StudentDashboardApiError(error.message);
  }

  return new StudentDashboardApiError("Dashboard data could not be loaded.");
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  try {
    const response = await apiClient.get<StudentDashboardData>("/student/dashboard");

    if (response.data.success === false) {
      throw new StudentDashboardApiError(
        response.data.message || "Dashboard data could not be loaded.",
      );
    }

    return response.data;
  } catch (error) {
    throw toStudentDashboardApiError(error);
  }
}
