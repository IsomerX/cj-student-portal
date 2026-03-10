export const authQueryKeys = {
  all: ["auth"] as const,
  profile: () => [...authQueryKeys.all, "profile"] as const,
};

export const dashboardQueryKeys = {
  all: ["student-dashboard"] as const,
  home: () => [...dashboardQueryKeys.all, "home"] as const,
};
