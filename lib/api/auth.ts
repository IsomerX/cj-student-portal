import { isAxiosError } from "axios";

import {
  type AuthSession,
  type AuthUser,
  type FirebaseLoginPayload,
  type LoginPayload,
  type VerifyEmailOtpPayload,
} from "@/lib/auth/types";
import { apiClient } from "@/lib/api/config";

interface AuthResponseBody {
  token?: string;
  access_token?: string;
  auth_token?: string;
  user?: AuthUser;
  message?: string;
  error?: string;
  code?: string;
  success?: boolean;
  alreadyVerified?: boolean;
}

export class AuthApiError extends Error {
  status: number | null;
  code: string | null;

  constructor(message: string, status: number | null = null, code: string | null = null) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

function getTokenFromBody(body: AuthResponseBody): string | null {
  return body.token ?? body.access_token ?? body.auth_token ?? null;
}

function getUserFromBody(body: Record<string, unknown>): AuthUser | null {
  const directUser = body.user as AuthUser | undefined;
  if (directUser) return directUser;

  const nestedData = body.data as Record<string, unknown> | undefined;
  if (!nestedData) return null;

  return (nestedData.user as AuthUser | undefined) ?? (nestedData as AuthUser);
}

function toAuthApiError(error: unknown): AuthApiError {
  if (error instanceof AuthApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const responseBody = (error.response?.data ?? {}) as AuthResponseBody;
    return new AuthApiError(
      responseBody.error || responseBody.message || error.message || "Authentication request failed.",
      error.response?.status ?? null,
      responseBody.code ?? null,
    );
  }

  if (error instanceof Error) {
    return new AuthApiError(error.message);
  }

  return new AuthApiError("Authentication request failed.");
}

async function fetchProfileWithHeaders(headers?: Record<string, string>) {
  const response = await apiClient.get("/auth/profile", { headers });
  const user = getUserFromBody(response.data as Record<string, unknown>);

  if (!user) {
    throw new AuthApiError("Profile could not be loaded after login.");
  }

  return user;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  try {
    const { appPlatform, ...requestBody } = payload;
    const response = await apiClient.post<AuthResponseBody>("/auth/login", requestBody, {
      headers: appPlatform ? { "X-App-Platform": appPlatform } : undefined,
    });
    const token = getTokenFromBody(response.data);

    if (!token) {
      throw new AuthApiError("No token returned from server.");
    }

    const user =
      response.data.user ??
      (await fetchProfileWithHeaders({ Authorization: `Bearer ${token}` }));

    return { token, user };
  } catch (error) {
    throw toAuthApiError(error);
  }
}

export async function firebaseLogin(payload: FirebaseLoginPayload): Promise<AuthSession> {
  try {
    const response = await apiClient.post<AuthResponseBody>("/auth/firebase-login", payload);
    const token = getTokenFromBody(response.data);

    if (!token) {
      throw new AuthApiError("No token returned from server.");
    }

    const user =
      response.data.user ??
      (await fetchProfileWithHeaders({ Authorization: `Bearer ${token}` }));

    return { token, user };
  } catch (error) {
    throw toAuthApiError(error);
  }
}

export async function verifyEmailOtp(
  payload: VerifyEmailOtpPayload,
): Promise<AuthSession> {
  try {
    const response = await apiClient.post<AuthResponseBody>("/auth/verify-email-otp", payload);
    const token = getTokenFromBody(response.data);

    if (!token) {
      throw new AuthApiError(response.data.message || "Verification succeeded, but no session was returned.");
    }

    const user =
      response.data.user ??
      (await fetchProfileWithHeaders({ Authorization: `Bearer ${token}` }));

    return { token, user };
  } catch (error) {
    throw toAuthApiError(error);
  }
}

export async function fetchProfile(): Promise<AuthUser> {
  try {
    return await fetchProfileWithHeaders();
  } catch (error) {
    throw toAuthApiError(error);
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return;
    }

    throw toAuthApiError(error);
  }
}

export { toAuthApiError };
