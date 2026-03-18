"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { updateUserName } from "@/lib/api/auth";

interface NameSetupDialogProps {
  open: boolean;
  userId: string | null;
  onComplete: (name: string) => void;
}

export function NameSetupDialog({ open, userId, onComplete }: NameSetupDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    setIsSubmitting(true);
    setError("");

    try {
      if (!userId) {
        setError("Profile could not be loaded. Please refresh and try again.");
        return;
      }

      await updateUserName(userId, fullName);
      onComplete(fullName);
    } catch (err: unknown) {
      console.error("Failed to update name:", err);
      const errorMessage = isAxiosError<{ error?: string }>(err)
        ? (err.response?.data?.error ?? "Failed to update name. Please try again.")
        : "Failed to update name. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" hideClose>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-center">Welcome! Let&apos;s get started</DialogTitle>
          <DialogDescription className="text-center">
            Please enter your full name to continue
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting}
              className="text-base"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !userId || !firstName.trim() || !lastName.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
