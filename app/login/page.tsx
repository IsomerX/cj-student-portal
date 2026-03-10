"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
import { FilterPill } from "@/components/ui/filter-pill";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { getStoredToken, persistSession } from "@/lib/auth/storage";
import { AuthApiError, login as loginRequest, toAuthApiError } from "@/lib/api/auth";
import { useLoginMutation, useVerifyEmailOtpMutation } from "@/hooks/use-auth";
import { useRecaptcha } from "@/hooks/use-recaptcha";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const modulePills = [
  "Attendance",
  "Assignments",
  "Exams",
  "Live Classes",
];

type FieldErrors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const verifyOtpMutation = useVerifyEmailOtpMutation();
  const recaptcha = useRecaptcha(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState(["", "", "", "", "", "", "", ""]);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      const recaptchaToken = recaptcha.isEnabled ? recaptcha.getToken() : undefined;

      if (recaptcha.isEnabled && !recaptcha.isReady) {
        throw new AuthApiError("Verification is still loading. Please wait a moment and try again.");
      }

      if (recaptcha.isEnabled && !recaptchaToken) {
        throw new AuthApiError("Please complete the reCAPTCHA verification before requesting a new OTP.");
      }

      try {
        return await loginRequest({ email, password, recaptchaToken });
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

  return (
    <>
      <main className="min-h-[100dvh] flex flex-col lg:flex-row bg-white selection:bg-[#283618]/20">
        {/* Banner/Brand Section (Top on mobile, Left on desktop) */}
        <section className="relative flex flex-col items-center justify-center bg-[#fff7eb] px-6 pb-12 pt-8 lg:w-[45%] lg:flex-none lg:items-start lg:justify-center lg:px-16 lg:py-24 overflow-hidden">
          {/* Background subtle orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-[20%] -top-[10%] h-[500px] w-[500px] rounded-full bg-[#ece5c8] opacity-50 mix-blend-multiply blur-[80px] lg:scale-150" />
            <div className="absolute -right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-white opacity-60 mix-blend-overlay blur-[60px]" />
          </div>

          <div className="relative z-10 flex w-full max-w-sm flex-col items-center lg:items-start lg:mx-auto lg:max-w-md xl:max-w-lg">
            <div className="flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-[1.25rem] border border-[#31421f]/10 bg-[#283618] text-white shadow-2xl shadow-[#283618]/20 ring-4 ring-white/50 transition-transform duration-500 hover:scale-[1.03]">
              <GraduationCap className="h-8 w-8 lg:h-10 lg:w-10" />
            </div>

            <div className="mt-4 lg:mt-8 text-center lg:text-left">
              <p className="text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.25em] text-[#283618]/70">
                Student Portal
              </p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-[#212121] lg:mt-2 lg:text-5xl">
                CJ Coaching
              </h2>
            </div>

            {/* Desktop marketing highlights */}
            <div className="mt-16 hidden lg:block space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#283618]/5 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-[#212121]">
                <Sparkles className="h-4 w-4 text-[#283618]" />
                Seamless Access
              </div>
              <h3 className="text-[2.5rem] font-bold leading-tight text-[#212121] max-w-[400px]">
                Everything you need after one sign-in.
              </h3>
              <p className="text-[17px] leading-relaxed text-[#474747] max-w-[400px]">
                Continue to attendance, assignments, exams, and live classes securely from your personal dashboard.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-4">
                {modulePills.map((module) => (
                  <FilterPill key={module} tone="neutral" selected className="font-semibold px-4 py-2 border border-[#ece5c8]/50 bg-white/50 backdrop-blur-sm shadow-sm text-[#212121] hover:bg-white transition-colors duration-300">
                    {module}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Form Section (Bottom native sheet on mobile, Right on desktop) */}
        <section className="relative z-20 flex flex-1 flex-col justify-center -mt-6 lg:mt-0 rounded-t-[2.5rem] lg:rounded-none bg-white px-6 py-6 lg:py-10 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.06)] sm:px-12 lg:px-24 xl:px-32 lg:shadow-none">
          {/* Mobile bottom-sheet indicator handle */}
          <div className="bg-gray-200 w-12 h-1.5 rounded-full mx-auto mb-6 opacity-60 lg:hidden" />

          <div className="mx-auto w-full max-w-sm lg:max-w-[420px]">
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-[2rem] font-extrabold tracking-tight text-[#212121] sm:text-[2.25rem] lg:text-[2.75rem]">
                Sign In
              </h1>
              <p className="text-[16px] font-medium text-[#737373]">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#414141]">
                  Email address
                </label>
                <div className="relative">
                  <Input
                    value={email}
                    onValueChange={(value) => {
                      setEmail(value);
                      setFieldErrors((current) => ({ ...current, email: undefined }));
                      setFormError(null);
                    }}
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    leftIcon={<Mail className="h-4 w-4" />}
                    clearable
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </div>
                {fieldErrors.email ? (
                  <p className="text-sm text-red-600">{fieldErrors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#414141]">
                  Password
                </label>
                <div className="relative">
                  <PasswordInput
                    value={password}
                    onValueChange={(value) => {
                      setPassword(value);
                      setFieldErrors((current) => ({ ...current, password: undefined }));
                      setFormError(null);
                    }}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                </div>
                {fieldErrors.password ? (
                  <p className="text-sm text-red-600">{fieldErrors.password}</p>
                ) : null}
              </div>

              {recaptcha.isEnabled ? (
                <div className="space-y-2 mt-4">
                  <div
                    id="student-portal-recaptcha"
                    className="flex min-h-[78px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#ece5c8] bg-[#faf9f6] p-3 transition-colors hover:border-[#283618]/30"
                  />
                  {!recaptcha.isReady ? (
                    <p className="text-sm font-medium text-[#737373] text-center mt-2">Loading secure verification...</p>
                  ) : null}
                </div>
              ) : null}

              {formError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-semibold text-red-600">{formError}</p>
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
                {loginMutation.isPending ? null : <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-12 flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#283618] bg-[#283618]/5 px-4 py-2.5 rounded-full shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                End-to-end Encrypted Session
              </div>
              <p className="text-[12px] uppercase tracking-wider font-bold text-[#737373] text-center">
                Need help? <a href="#" className="text-[#283618] hover:underline hover:text-[#202b13] transition-colors ml-1">Contact Coordinator</a>
              </p>
            </div>
          </div>
        </section>
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
