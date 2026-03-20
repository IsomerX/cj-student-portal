"use client";

import * as React from "react";
import type { ConfirmationResult } from "firebase/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useLoginMutation, useVerifyEmailOtpMutation, useFirebaseLoginMutation } from "@/hooks/use-auth";
import { AuthApiError, login as loginRequest, toAuthApiError } from "@/lib/api/auth";
import { getStoredToken, persistSession } from "@/lib/auth/storage";
import {
  isFirebasePhoneAuthConfigured,
  isFirebasePhoneAuthTestingEnabled,
  requestPhoneOtp,
  resetPhoneRecaptcha,
  signOutFirebaseUser,
  toFirebasePhoneAuthError,
  verifyPhoneOtp,
} from "@/lib/firebase/auth";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return (
      digits.length === 10 ||
      (digits.length === 11 && digits.startsWith("0")) ||
      (digits.length === 12 && digits.startsWith("91"))
    );
  }, "Enter a valid 10-digit mobile number.");

const phoneOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit OTP.");

type FieldErrors = Partial<Record<"email" | "password", string>>;
type LoginMode = "phone" | "email";

function detectMobileBrowser() {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent);
}

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const firebaseLoginMutation = useFirebaseLoginMutation();
  const verifyOtpMutation = useVerifyEmailOtpMutation();
  const isPhoneLoginEnabled = isFirebasePhoneAuthConfigured();
  const isFirebasePhoneTestingEnabled = isFirebasePhoneAuthTestingEnabled();
  const [loginMode, setLoginMode] = React.useState<LoginMode>(isPhoneLoginEnabled ? "phone" : "email");
  const [isMobileBrowser, setIsMobileBrowser] = React.useState<boolean | null>(null);
  // Disable reCAPTCHA for student portal - backend bypasses it via x-app-platform header
  const recaptcha = useRecaptcha(undefined);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState(["", "", "", "", "", "", "", ""]);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = React.useState(false);

  const [phone, setPhone] = React.useState("");
  const [phoneOtp, setPhoneOtp] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = React.useState<string | null>(null);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = React.useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = React.useState(false);
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = React.useState<string | null>(null);

  const resetViewportPosition = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    scrollToTop();
    window.requestAnimationFrame(scrollToTop);
    window.setTimeout(scrollToTop, 120);
  }, []);

  const navigateToDashboard = React.useCallback(() => {
    if (typeof window === "undefined") {
      router.push("/dashboard");
      return;
    }

    resetViewportPosition();
    window.requestAnimationFrame(() => {
      router.push("/dashboard");
    });
  }, [resetViewportPosition, router]);

  React.useEffect(() => {
    setIsMobileBrowser(detectMobileBrowser());
  }, []);

  React.useEffect(() => {
    resetViewportPosition();
  }, [resetViewportPosition]);

  React.useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  React.useEffect(() => {
    return () => {
      resetPhoneRecaptcha();
      void signOutFirebaseUser().catch(() => undefined);
    };
  }, []);

  const resetPhoneFlow = React.useCallback(() => {
    setPhoneOtp("");
    setPhoneError(null);
    setPhoneInfo(null);
    setConfirmationResult(null);
    setVerifiedPhoneNumber(null);
    resetPhoneRecaptcha();
    void signOutFirebaseUser().catch(() => undefined);
  }, []);

  const switchMode = (nextMode: LoginMode) => {
    setLoginMode(nextMode);
    setFormError(null);
    setFieldErrors({});
    setPhoneError(null);
    setPhoneInfo(null);

    if (nextMode === "email") {
      resetPhoneFlow();
    }
  };

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      // Student portal bypasses reCAPTCHA via x-app-platform: mobile header
      const appPlatform = "mobile";

      try {
        return await loginRequest({ email, password, recaptchaToken: undefined, appPlatform });
      } catch (error) {
        const authError = toAuthApiError(error);
        if (authError.status === 403 && authError.code === "EMAIL_VERIFICATION_REQUIRED") {
          return null;
        }
        throw authError;
      }
    },
    onSuccess: (session) => {
      if (session) {
        persistSession(session);
        navigateToDashboard();
        return;
      }
      setOtp(Array(8).fill(""));
      setOtpError(null);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "email" || path === "password") {
          nextErrors[path] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    // Student portal bypasses reCAPTCHA via x-app-platform: mobile header
    const appPlatform = "mobile";

    try {
      await loginMutation.mutateAsync({
        email: parsed.data.email,
        password: parsed.data.password,
        recaptchaToken: undefined,
        appPlatform,
      });
      navigateToDashboard();
    } catch (error) {
      const authError = toAuthApiError(error);
      if (authError.status === 403 && authError.code === "EMAIL_VERIFICATION_REQUIRED") {
        setOtp(Array(8).fill(""));
        setOtpError(null);
        setIsOtpDialogOpen(true);
      } else {
        setFormError(authError.message);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    setOtpError(null);

    if (otpValue.length !== 8) {
      setOtpError("Please enter the full 8-digit OTP.");
      return;
    }

    try {
      await verifyOtpMutation.mutateAsync({ email, otp: otpValue });
      setIsOtpDialogOpen(false);
      navigateToDashboard();
    } catch (error) {
      setOtpError(toAuthApiError(error).message);
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      await resendOtpMutation.mutateAsync();
    } catch (error) {
      setOtpError(toAuthApiError(error).message);
    }
  };

  const handleSendPhoneOtp = async () => {
    setPhoneError(null);
    setPhoneInfo(null);

    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? "Enter a valid mobile number.");
      return;
    }

    setIsSendingPhoneOtp(true);

    try {
      const result = await requestPhoneOtp(parsed.data, "student-portal-firebase-recaptcha");
      setConfirmationResult(result.confirmationResult);
      setVerifiedPhoneNumber(result.normalizedPhone);
      setPhoneOtp("");
      setPhoneInfo(`OTP sent to ${result.normalizedPhone}`);
    } catch (error) {
      setPhoneError(toFirebasePhoneAuthError(error));
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setPhoneError(null);

    if (!confirmationResult) {
      setPhoneError("Request an OTP first.");
      return;
    }

    const parsed = phoneOtpSchema.safeParse(phoneOtp);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? "Enter the 6-digit OTP.");
      return;
    }

    setIsVerifyingPhoneOtp(true);

    try {
      const verified = await verifyPhoneOtp(confirmationResult, parsed.data);
      try {
        await firebaseLoginMutation.mutateAsync({
          idToken: verified.idToken,
          phoneNumber: verified.phoneNumber ?? verifiedPhoneNumber ?? undefined,
        });

        await signOutFirebaseUser();
        navigateToDashboard();
      } catch (backendError) {
        setPhoneError(toAuthApiError(backendError).message);
        resetPhoneFlow();
      }
    } catch (firebaseError) {
      setPhoneError(toFirebasePhoneAuthError(firebaseError));
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  return (
    <>
      <main className="relative flex min-h-[100dvh] items-start justify-center overflow-y-auto overflow-x-hidden bg-[#f0f2e8] px-5 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] pt-[max(2.25rem,calc(env(safe-area-inset-top)+1.25rem))] selection:bg-[#283618]/20 sm:items-center sm:py-10">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] -rotate-[15deg] scale-[1.3]"
          style={{
            backgroundImage: "url(/images/background-pattern.png)",
            backgroundSize: "320px 320px",
            backgroundRepeat: "repeat",
            width: "150%",
            height: "150%",
            top: "-25%",
            left: "-25%",
          }}
        />

        <div className="relative z-10 my-auto w-full max-w-[340px] md:max-w-[850px] lg:max-w-[1000px] flex flex-col md:flex-row md:bg-white md:rounded-[2rem] md:shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden">

          <div className="w-full text-center mb-7 md:hidden">
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-[#212121]">
              SCHOOL DOST
            </h1>
          </div>

          <div className="hidden md:flex flex-col justify-center w-[45%] lg:w-1/2 bg-[#efebd8] p-8 lg:p-12 relative">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#f7f5e9] rounded-full -translate-y-1/2 translate-x-1/2 mix-blend-overlay" />

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="bg-[#3c3c3c] p-2.5 rounded-xl text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#212121] leading-tight">SCHOOL DOST</h1>
                <p className="text-[13px] text-[#626262]">Student Portal</p>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#212121] mb-3">
                Welcome Back!
              </h2>
              <p className="text-[#4a4a4a] text-sm lg:text-base leading-relaxed mb-10 xl:pr-10">
                Access your dashboard to attend live classes, submit assignments, and track your academic progress all in one place.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-white/40 p-3.5 rounded-xl border border-white/40">
                  <div className="bg-[#424242] p-2 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#212121]">Live Classes</h3>
                    <p className="text-xs text-[#626262] mt-0.5">Join sessions & watch recordings</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/40 p-3.5 rounded-xl border border-white/40">
                  <div className="bg-[#424242] p-2 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#212121]">Assignments</h3>
                    <p className="text-xs text-[#626262] mt-0.5">Submit work & track progress</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/40 p-3.5 rounded-xl border border-white/40">
                  <div className="bg-[#424242] p-2 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#212121]">Doubt Resolution</h3>
                    <p className="text-xs text-[#626262] mt-0.5">Get help from expert teachers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center md:px-10 lg:px-12 md:py-16 relative z-20">
            <div className="w-full rounded-xl bg-white px-7 py-9 shadow-[5px_6px_0_rgba(0,0,0,0.2)] md:shadow-none md:p-0">
              <div className="mb-8 md:text-left text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-[#212121]">
                  Sign In
                </h2>
                <p className="mt-2 text-sm text-[#626262]">
                  Enter your credentials to access your account
                </p>
              </div>

              {isPhoneLoginEnabled ? (
                <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#f6f3e6] p-1">
                  <button
                    type="button"
                    onClick={() => switchMode("phone")}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      loginMode === "phone"
                        ? "bg-[#283618] text-white shadow-sm"
                        : "text-[#626262] hover:bg-white hover:text-[#212121]",
                    )}
                  >
                    Phone OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("email")}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      loginMode === "email"
                        ? "bg-[#283618] text-white shadow-sm"
                        : "text-[#626262] hover:bg-white hover:text-[#212121]",
                    )}
                  >
                    Email
                  </button>
                </div>
              ) : null}

              {loginMode === "phone" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#212121]">
                      Mobile Number
                    </label>
                    <Input
                      value={phone}
                      onValueChange={(value) => {
                        setPhone(value);
                        setPhoneError(null);
                        setPhoneInfo(null);
                      }}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="enter your 10-digit mobile"
                      disabled={Boolean(confirmationResult)}
                    />
                  </div>

                  {confirmationResult ? (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[#212121]">
                        OTP
                      </label>
                      <Input
                        value={phoneOtp}
                        onValueChange={(value) => {
                          setPhoneOtp(value.replace(/\D/g, "").slice(0, 6));
                          setPhoneError(null);
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="enter the 6-digit OTP"
                      />
                    </div>
                  ) : null}

                  {phoneInfo ? (
                    <div className="rounded-lg border border-[#d6e0c2] bg-[#f7faf1] px-3 py-2.5">
                      <p className="text-xs font-medium text-[#3d4f27] text-center">
                        {phoneInfo}
                      </p>
                    </div>
                  ) : null}

                  {phoneError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                      <p className="text-xs font-medium text-red-600 text-center break-words break-all whitespace-pre-wrap">
                        {phoneError}
                      </p>
                    </div>
                  ) : null}

                  <div id="student-portal-firebase-recaptcha" className="hidden" />

                  {isFirebasePhoneTestingEnabled ? (
                    <div className="rounded-lg border border-[#d6e0c2] bg-[#f7faf1] px-3 py-2.5">
                      <p className="text-xs font-medium text-[#3d4f27] text-center">
                        Local test mode is on. Use a Firebase test phone number and
                        its test OTP from the Firebase console. Real SMS will not be sent on localhost.
                      </p>
                    </div>
                  ) : null}

                  {confirmationResult ? (
                    <div className="space-y-3 pt-2">
                      <Button
                        type="button"
                        className="w-full"
                        onClick={handleVerifyPhoneOtp}
                        disabled={isVerifyingPhoneOtp || firebaseLoginMutation.isPending}
                      >
                        {isVerifyingPhoneOtp || firebaseLoginMutation.isPending
                          ? "Verifying..."
                          : "Verify OTP and login"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          resetPhoneFlow();
                          await handleSendPhoneOtp();
                        }}
                        disabled={isSendingPhoneOtp}
                      >
                        {isSendingPhoneOtp ? "Sending..." : "Resend OTP"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={resetPhoneFlow}
                      >
                        Use a different number
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="w-full !mt-2"
                      onClick={handleSendPhoneOtp}
                      disabled={isSendingPhoneOtp}
                    >
                      {isSendingPhoneOtp ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#212121]">
                      Email
                    </label>
                    <Input
                      value={email}
                      onValueChange={(value) => {
                        setEmail(value);
                        setFieldErrors((current) => ({ ...current, email: undefined }));
                        setFormError(null);
                      }}
                      type="email"
                      autoComplete="email"
                      placeholder="enter your email"
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                    {fieldErrors.email ? (
                      <p className="text-xs text-red-600">{fieldErrors.email}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#212121]">
                      Password
                    </label>
                    <PasswordInput
                      value={password}
                      onValueChange={(value) => {
                        setPassword(value);
                        setFieldErrors((current) => ({ ...current, password: undefined }));
                        setFormError(null);
                      }}
                      autoComplete="current-password"
                      placeholder="enter your password"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    {fieldErrors.password ? (
                      <p className="text-xs text-red-600">{fieldErrors.password}</p>
                    ) : null}
                  </div>

                  {formError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                      <p className="text-xs font-medium text-red-600 text-center break-words break-all whitespace-pre-wrap">
                        {formError}
                      </p>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full !mt-6"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Login"}
                  </Button>
                </form>
              )}

              <p className="mt-6 md:mt-10 text-center text-xs text-[#626262]">
                Don&apos;t have an account?{" "}
                <span className="font-bold">Contact admin</span>
              </p>
            </div>

            <p className="mt-6 text-center text-xs font-medium text-[#626262] md:mt-6">
              Powered by School Dost
            </p>
          </div>
        </div>
      </main>

      <EmailVerificationDialog
        open={isOtpDialogOpen}
        onOpenChange={setIsOtpDialogOpen}
        email={email}
        otp={otp}
        onOtpChange={setOtp}
        error={otpError}
        isSubmitting={verifyOtpMutation.isPending}
        isResending={resendOtpMutation.isPending}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </>
  );
}
