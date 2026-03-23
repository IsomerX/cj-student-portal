export const authQueryKeys = {
  all: ["auth"] as const,
  profile: () => [...authQueryKeys.all, "profile"] as const,
};

export const dashboardQueryKeys = {
  all: ["student-dashboard"] as const,
  home: () => [...dashboardQueryKeys.all, "home"] as const,
};

export const doubtQueryKeys = {
  all: ["doubts"] as const,
  feed: <T extends object>(filters: T) =>
    [...doubtQueryKeys.all, "feed", filters] as const,
  mine: <T extends object>(filters: T) =>
    [...doubtQueryKeys.all, "mine", filters] as const,
  detail: (doubtId: string) => [...doubtQueryKeys.all, "detail", doubtId] as const,
  messages: (doubtId: string) => [...doubtQueryKeys.all, "messages", doubtId] as const,
  related: (doubtId: string) => [...doubtQueryKeys.all, "related", doubtId] as const,
  subjects: (classSectionId?: string) =>
    [...doubtQueryKeys.all, "subjects", classSectionId ?? "all"] as const,
  similar: (text: string) => [...doubtQueryKeys.all, "similar", text] as const,
};

export const liveClassQueryKeys = {
  all: ["live-classes"] as const,
  list: () => [...liveClassQueryKeys.all, "list"] as const,
  token: (classId: string) => [...liveClassQueryKeys.all, "token", classId] as const,
  recordings: () => [...liveClassQueryKeys.all, "recordings"] as const,
};

export const feeQueryKeys = {
  all: ["fees"] as const,
  pending: (studentId: string | null) => [...feeQueryKeys.all, "pending", studentId] as const,
  statistics: (studentId: string | null) => [...feeQueryKeys.all, "statistics", studentId] as const,
  transactions: (studentId: string | null, limit: number, offset: number) =>
    [...feeQueryKeys.all, "transactions", studentId, limit, offset] as const,
};
