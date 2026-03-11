"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
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

type FieldErrors = Partial<Record<"email" | "password", string>>;

function detectMobileBrowser() {
    if (typeof window === "undefined") return false;
    return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent);
}

export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLoginMutation();
    const verifyOtpMutation = useVerifyEmailOtpMutation();
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

    React.useEffect(() => {
        setIsMobileBrowser(detectMobileBrowser());
    }, []);

    React.useEffect(() => {
        if (getStoredToken()) {
            router.replace("/dashboard");
        }
    }, [router]);

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

    return (
        <>
            <main className="min-h-[100dvh] flex items-center justify-center bg-[#f0f2e8] px-5 py-10 relative overflow-hidden selection:bg-[#283618]/20">
                {/* Repeating background pattern — rotated robot doodles */}
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
                    {/* Brand title */}
                    <h1 className="text-center text-[1.75rem] font-extrabold tracking-tight text-[#212121] mb-7">
                        SCHOOL DOST
                    </h1>

                    {/* Login card */}
                    <div className="rounded-xl bg-white px-7 py-9 shadow-[5px_6px_0_rgba(0,0,0,0.2)]">
                        {/* Card header */}
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-[#212121]">
                                Student Login
                            </h2>
                            <p className="mt-3 text-sm text-[#626262] leading-relaxed">
                                Hey, enter your details to sign in to your account
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
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

                            {/* Password */}
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

                            {/* Recaptcha */}
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

                            {/* Form error */}
                            {formError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                                    <p className="text-xs font-medium text-red-600 text-center">
                                        {formError}
                                    </p>
                                </div>
                            ) : null}

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full !mt-6"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? "Signing in..." : "Login"}
                            </Button>
                        </form>

                        {/* Don't have an account */}
                        <p className="mt-5 text-center text-xs text-[#626262]">
                            Don&apos;t have an account?{" "}
                            <span className="font-bold">Contact admin</span>
                        </p>
                    </div>

                    {/* Footer */}
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
