"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthProfileQuery } from "@/hooks/use-auth";
import { getStoredToken } from "@/lib/auth/storage";
import { apiClient } from "@/lib/api/config";
import { format, differenceInDays } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [daysUntilNextChange, setDaysUntilNextChange] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  useEffect(() => {
    if (profileQuery.data) {
      const currentName = profileQuery.data.name || "";
      const nameParts = currentName.trim().split(/\s+/);

      if (nameParts.length >= 2) {
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(" "));
      } else if (nameParts.length === 1 && nameParts[0]) {
        setFirstName(nameParts[0]);
        setLastName("");
      } else {
        setFirstName("");
        setLastName("");
      }

      // Calculate days until next name change
      if (profileQuery.data.nameLastChangedAt) {
        const lastChanged = new Date(profileQuery.data.nameLastChangedAt);
        const daysSinceChange = differenceInDays(new Date(), lastChanged);
        const daysRemaining = 15 - daysSinceChange;
        setDaysUntilNextChange(daysRemaining > 0 ? daysRemaining : 0);
      } else {
        setDaysUntilNextChange(null); // Never changed before
      }
    }
  }, [profileQuery.data]);

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }

    const newName = `${firstName.trim()} ${lastName.trim()}`;

    if (newName === profileQuery.data?.name) {
      setError("New name is the same as current name");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    const newName = `${firstName.trim()} ${lastName.trim()}`;

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setShowConfirmDialog(false);

    try {
      const response = await apiClient.patch("/auth/profile", {
        name: newName,
      });

      if (response.data.success) {
        setSuccess("Name updated successfully!");
        profileQuery.refetch();

        // Reset after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError(response.data.error || "Failed to update name");
      }
    } catch (err: any) {
      console.error("Failed to update name:", err);
      const errorMessage = err.response?.data?.error || "Failed to update name. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#283618]" />
      </div>
    );
  }

  const user = profileQuery.data;
  const canChangeName = daysUntilNextChange === null || daysUntilNextChange === 0;
  const nextChangeDate = user?.nameLastChangedAt
    ? new Date(new Date(user.nameLastChangedAt).getTime() + 15 * 24 * 60 * 60 * 1000)
    : null;
  const newFullName = `${firstName.trim()} ${lastName.trim()}`;

  return (
    <>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Name Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change your name to <strong>{newFullName}</strong>?
              {canChangeName && " You won't be able to change it again for 15 days."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmChange} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-[#f0f2f5] pb-20">
        {/* Header */}
        <section
          className="border-b border-[#ece5c8] bg-white px-3 py-4 shadow-sm sm:px-6 lg:px-8"
          style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
        >
          <div className="mx-auto max-w-4xl flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#414141] transition-colors hover:bg-[#e5e7eb]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-[#212121]">Profile Settings</h1>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-3 pt-6 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Name</CardTitle>
              <CardDescription>
                {user?.email && <div className="mb-1 text-sm font-medium">{user.email}</div>}
                Update your display name. Changes are restricted to once every 15 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Name */}
              <div className="space-y-2">
                <Label>Current Name</Label>
                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                  {user?.name || "(No name set)"}
                </div>
              </div>

              {/* Last Changed */}
              {user?.nameLastChangedAt && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Changed
                  </Label>
                  <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                    {format(new Date(user.nameLastChangedAt), "PPP")}
                  </div>
                </div>
              )}

              {/* Restriction Status */}
              {daysUntilNextChange !== null && daysUntilNextChange > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-orange-900">
                        Name change restricted
                      </p>
                      <p className="text-sm text-orange-700">
                        You can change your name again in{" "}
                        <strong>{daysUntilNextChange} day{daysUntilNextChange > 1 ? "s" : ""}</strong>
                        {nextChangeDate && (
                          <> (on {format(nextChangeDate, "PPP")})</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-900">{success}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-900">{error}</p>
                  </div>
                </div>
              )}

              {/* New Name Inputs */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {user?.name ? "First Name" : "Enter Your First Name"}
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  disabled={!canChangeName || isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {user?.name ? "Last Name" : "Enter Your Last Name"}
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  disabled={!canChangeName || isSubmitting}
                />
              </div>

              {/* Update Button */}
              <Button
                onClick={handleSubmit}
                disabled={
                  !canChangeName ||
                  isSubmitting ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  newFullName === user?.name
                }
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Name"
                )}
              </Button>

              {/* Help Text */}
              {!user?.name && (
                <p className="text-xs text-muted-foreground">
                  This is your first time setting your name. After this, you can change it once every 15 days.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
