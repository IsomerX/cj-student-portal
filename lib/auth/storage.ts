"use client";

import type { AuthSession, AuthUser } from "@/lib/auth/types";

const ACCESS_TOKEN_KEY = "access_token";
const TOKEN_KEY = "token";
const USER_KEY = "user";
const USER_ROLE_COOKIE = "user_role";
const ACCESS_TOKEN_COOKIE = "access_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function setCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
  localStorage.setItem(TOKEN_KEY, session.token);
  setCookie(ACCESS_TOKEN_COOKIE, session.token);

  if (session.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));

    if (session.user.role) {
      setCookie(USER_ROLE_COOKIE, session.user.role.toLowerCase());
    }
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(USER_ROLE_COOKIE);
}
