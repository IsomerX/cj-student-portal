"use client";

import * as React from "react";
import { ArrowRight, Mail, RefreshCw, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  otp: string[];
  onOtpChange: (otp: string[]) => void;
  error: string | null;
  isSubmitting: boolean;
  isResending: boolean;
  onSubmit: () => void;
  onResend: () => void;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  email,
  otp,
  onOtpChange,
  error,
  isSubmitting,
  isResending,
  onSubmit,
  onResend,
}: EmailVerificationDialogProps) {
  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value;
    onOtpChange(nextOtp);

    if (value && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      const previousInput = document.getElementById(`otp-${index - 1}`);
      previousInput?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").slice(0, 8);
    const digits = pastedData.split("").filter((char) => /^\d$/.test(char));

    const nextOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 8) nextOtp[index] = digit;
    });
    onOtpChange(nextOtp);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl border-[#ece5c8] p-0">
        <div className="rounded-3xl bg-white p-8">
          <DialogHeader className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#283618] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl">Verify your email</DialogTitle>
            <DialogDescription className="text-sm">
              This account needs a one-time verification before the first sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6 rounded-2xl border border-[#ece5c8] bg-[#faf9f6] p-4">
            <div className="flex items-center gap-2 text-sm text-[#474747]">
              <Mail className="h-4 w-4 text-[#283618]" />
              <span>OTP sent to</span>
              <span className="font-semibold text-[#283618]">{email}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-4 text-sm font-semibold text-[#414141]">Enter 8-digit OTP</p>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    className="h-12 w-10 rounded-xl border border-gray-200 bg-white text-center text-lg font-bold text-[#414141] outline-none transition-colors focus:border-[#283618] focus:ring-2 focus:ring-[#283618]/20"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            ) : null}

            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify and continue"}
              {isSubmitting ? null : <ArrowRight className="h-4 w-4" />}
            </Button>

            <div className="border-t border-gray-200 pt-5">
              <p className="mb-3 text-center text-sm text-[#737373]">
                Didn&apos;t receive the OTP?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onResend}
                disabled={isResending}
              >
                <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
                {isResending ? "Resending..." : "Resend OTP"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
