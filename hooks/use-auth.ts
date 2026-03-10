"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type LoginPayload, type VerifyEmailOtpPayload } from "@/lib/auth/types";
import { clearSession, getStoredToken, persistSession } from "@/lib/auth/storage";
import { fetchProfile, login, logout, verifyEmailOtp } from "@/lib/api/auth";
import { authQueryKeys } from "@/lib/query-keys";

export function useAuthProfileQuery() {
  const token = getStoredToken();

  return useQuery({
    queryKey: authQueryKeys.profile(),
    queryFn: fetchProfile,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (session) => {
      persistSession(session);
      if (session.user) {
        queryClient.setQueryData(authQueryKeys.profile(), session.user);
      }
    },
  });
}

export function useVerifyEmailOtpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyEmailOtpPayload) => verifyEmailOtp(payload),
    onSuccess: (session) => {
      persistSession(session);
      if (session.user) {
        queryClient.setQueryData(authQueryKeys.profile(), session.user);
      }
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
    },
  });
}
