"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  type ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let authInstance: Auth | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaContainerId: string | null = null;
let recaptchaRenderPromise: Promise<number> | null = null;

function isLocalhostHost(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function isFirebasePhoneAuthConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

export function isFirebasePhoneAuthTestingEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PHONE_AUTH_TESTING === "true" &&
    isLocalhostHost()
  );
}

export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  throw new Error("Enter a valid 10-digit mobile number.");
}

function clearRecaptchaContainer(containerId: string | null): void {
  if (typeof window === "undefined" || !containerId) {
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = "";
}

function getFirebaseAuth(): Auth {
  if (!isFirebasePhoneAuthConfigured()) {
    throw new Error("Firebase phone login is not configured.");
  }

  if (authInstance) {
    return authInstance;
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: firebaseConfig.apiKey,
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          appId: firebaseConfig.appId,
        });

  authInstance = getAuth(app);
  authInstance.settings.appVerificationDisabledForTesting =
    isFirebasePhoneAuthTestingEnabled();
  authInstance.useDeviceLanguage();
  return authInstance;
}

export async function requestPhoneOtp(
  phone: string,
  containerId: string,
): Promise<{ confirmationResult: ConfirmationResult; normalizedPhone: string }> {
  if (typeof window === "undefined") {
    throw new Error("Phone login is only available in the browser.");
  }

  const auth = getFirebaseAuth();
  const normalizedPhone = normalizeIndianPhone(phone);

  if (recaptchaVerifier && recaptchaContainerId !== containerId) {
    resetPhoneRecaptcha();
  }

  if (!recaptchaVerifier) {
    clearRecaptchaContainer(containerId);
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
    recaptchaContainerId = containerId;
    recaptchaRenderPromise = recaptchaVerifier.render();
  }

  await recaptchaRenderPromise;

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      normalizedPhone,
      recaptchaVerifier,
    );

    return { confirmationResult, normalizedPhone };
  } catch (error) {
    resetPhoneRecaptcha();
    throw error;
  }
}

export async function verifyPhoneOtp(
  confirmationResult: ConfirmationResult,
  otp: string,
): Promise<{ idToken: string; phoneNumber: string | null }> {
  const credential = await confirmationResult.confirm(otp);
  const idToken = await credential.user.getIdToken();

  return {
    idToken,
    phoneNumber: credential.user.phoneNumber ?? null,
  };
}

export async function signOutFirebaseUser(): Promise<void> {
  if (!authInstance) {
    return;
  }

  await signOut(authInstance);
}

export function resetPhoneRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  clearRecaptchaContainer(recaptchaContainerId);
  recaptchaContainerId = null;
  recaptchaRenderPromise = null;
}

export function toFirebasePhoneAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  switch (code) {
    case "auth/invalid-phone-number":
      return "Enter a valid mobile number.";
    case "auth/missing-phone-number":
      return "Phone number is required.";
    case "auth/operation-not-allowed":
      return "Phone sign-in is not enabled in Firebase yet.";
    case "auth/too-many-requests":
      return "Too many OTP attempts. Please wait a bit and try again.";
    case "auth/invalid-verification-code":
      return "The OTP you entered is incorrect.";
    case "auth/code-expired":
      return "This OTP has expired. Please request a new one.";
    case "auth/quota-exceeded":
      return "Firebase SMS quota has been exceeded for this project.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Please try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication settings.";
    default:
      return error instanceof Error ? error.message : "Phone login failed. Please try again.";
  }
}
