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
  const recaptcha = useRecaptcha(
    isMobileBrowser === false ? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY : undefined,
  );

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

  React.useEffect(() => {
    setIsMobileBrowser(detectMobileBrowser());
  }, []);

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
      const appPlatform = (isMobileBrowser ?? detectMobileBrowser()) ? "mobile" : undefined;
      const recaptchaToken = recaptcha.isEnabled ? recaptcha.getToken() : undefined;

      if (recaptcha.isEnabled && !recaptcha.isReady) {
        throw new AuthApiError("Verification is still loading. Please wait a moment and try again.");
      }

      if (recaptcha.isEnabled && !recaptchaToken) {
        throw new AuthApiError("Please complete the reCAPTCHA verification before requesting a new OTP.");
      }

      try {
        return await loginRequest({ email, password, recaptchaToken, appPlatform });
      } catch (error) {
        const authError = toAuthApiError(error);
        if (authError.status === 403 && authError.code === "EMAIL_VERIFICATION_REQUIRED") {
          return null;
        }
        throw authError;
      } finally {
        recaptcha.reset();
      }
    },
    onSuccess: (session) => {
      if (session) {
        persistSession(session);
        router.push("/dashboard");
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

    const appPlatform = (isMobileBrowser ?? detectMobileBrowser()) ? "mobile" : undefined;
    const recaptchaToken = recaptcha.isEnabled ? recaptcha.getToken() : undefined;

    if (recaptcha.isEnabled && !recaptcha.isReady) {
      setFormError("Verification is still loading. Please wait a moment and try again.");
      return;
    }

    if (recaptcha.isEnabled && !recaptchaToken) {
      setFormError("Please complete the reCAPTCHA verification to continue.");
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: parsed.data.email,
        password: parsed.data.password,
        recaptchaToken,
        appPlatform,
      });
      router.push("/dashboard");
    } catch (error) {
      const authError = toAuthApiError(error);
      if (authError.status === 403 && authError.code === "EMAIL_VERIFICATION_REQUIRED") {
        setOtp(Array(8).fill(""));
        setOtpError(null);
        setIsOtpDialogOpen(true);
      } else {
        setFormError(authError.message);
      }
    } finally {
      recaptcha.reset();
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
      router.push("/dashboard");
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
        router.push("/dashboard");
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
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#f0f2e8] px-5 py-10 relative overflow-hidden selection:bg-[#283618]/20">
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

        <div className="relative z-10 w-full max-w-[340px]">
          <h1 className="text-center text-[1.75rem] font-extrabold tracking-tight text-[#212121] mb-7">
            SCHOOL DOST
          </h1>

          <div className="rounded-xl bg-white px-7 py-9 shadow-[5px_6px_0_rgba(0,0,0,0.2)]">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#212121]">
                Student Login
              </h2>
              <p className="mt-3 text-sm text-[#626262] leading-relaxed">
                Sign in to access classes, recordings, assignments, and doubts.
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
                    <p className="text-xs font-medium text-red-600 text-center">
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

                {recaptcha.isEnabled ? (
                  <div className="space-y-2">
                    <div
                      id="student-portal-recaptcha"
                      className="flex min-h-[78px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#ece5c8] bg-[#faf9f6] p-3"
                    />
                    {!recaptcha.isReady ? (
                      <p className="text-xs text-[#737373] text-center">
                        Loading verification...
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {formError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                    <p className="text-xs font-medium text-red-600 text-center">
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

            <p className="mt-5 text-center text-xs text-[#626262]">
              Don&apos;t have an account?{" "}
              <span className="font-bold">Contact admin</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-[#626262]">
            Powered by School Dost
          </p>
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
