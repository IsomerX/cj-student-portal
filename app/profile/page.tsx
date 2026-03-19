"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, AlertCircle, Loader2, Pencil, Mail, School, Users } from "lucide-react";
import { toast } from "sonner";
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
import { useMyBatchesQuery } from "@/hooks/use-assignments";
import { getStoredToken } from "@/lib/auth/storage";
import { updateUserName } from "@/lib/api/auth";
import { format, differenceInDays } from "date-fns";

function ProfileDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5]">
        <Icon className="h-4 w-4 text-[#283618]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-[#212121]">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const batchesQuery = useMyBatchesQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [daysUntilNextChange, setDaysUntilNextChange] = useState<number | null>(null);

  const buildFullName = () => [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

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
        const lastChanged = new Date(profileQuery.data.nameLastChangedAt as string);
        const daysSinceChange = differenceInDays(new Date(), lastChanged);
        const daysRemaining = 15 - daysSinceChange;
        setDaysUntilNextChange(daysRemaining > 0 ? daysRemaining : 0);
      } else {
        setDaysUntilNextChange(null); // Never changed before
      }
    }
  }, [profileQuery.data]);

  const handleSubmit = async () => {
    const newName = buildFullName();

    if (!firstName.trim()) {
      toast.warning("Please enter your first name");
      return;
    }

    if (newName === profileQuery.data?.name) {
      toast.warning("New name is the same as current name");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    const newName = buildFullName();
    const userId = profileQuery.data?.id;

    if (!userId) {
      toast.error("Profile could not be loaded. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      await updateUserName(userId, newName);
      toast.success("Name updated successfully!");
      setIsEditing(false);
      profileQuery.refetch();
    } catch (err: unknown) {
      console.error("Failed to update name:", err);
      if (err instanceof Error) {
        toast.error("Name change restricted", {
          description: err.message,
        });
      } else {
        toast.error("Failed to update name. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    // Reset form to current profile data
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
    }
    setIsEditing(false);
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
    ? new Date(new Date(user.nameLastChangedAt as string).getTime() + 15 * 24 * 60 * 60 * 1000)
    : null;
  const newFullName = buildFullName();

  return (
    <>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="top-[50%] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[22rem] translate-y-[-50%] gap-0 overflow-hidden rounded-2xl border-[#ece5c8] p-0 sm:max-w-[24rem]">
          <div className="p-5 sm:p-6">
            <DialogHeader className="space-y-2 pr-8 text-center sm:text-center">
              <DialogTitle className="text-xl">Confirm Name Change</DialogTitle>
              <DialogDescription className="text-sm leading-6">
                Are you sure you want to change your name to{" "}
                <span className="font-semibold text-[#283618]">{newFullName}</span>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-5 flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button onClick={handleConfirmChange} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
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
              onClick={() => {
                if (isEditing) {
                  handleCancelEditing();
                } else {
                  router.back();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#414141] transition-colors hover:bg-[#e5e7eb]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-[#212121]">
              {isEditing ? "Edit Profile" : "Profile Settings"}
            </h1>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-3 pt-6 sm:px-6 lg:px-8">
          {isEditing ? (
            /* ──────────── Edit Mode ──────────── */
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
                {!!user?.nameLastChangedAt && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last Changed
                    </Label>
                    <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                      {format(new Date(user.nameLastChangedAt as string), "PPP")}
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

                {/* New Name Inputs */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!canChangeName || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name (Optional)</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name (optional)"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!canChangeName || isSubmitting}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !canChangeName ||
                      isSubmitting ||
                      !firstName.trim() ||
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
                  <Button
                    variant="outline"
                    onClick={handleCancelEditing}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Help Text */}
                {!user?.name && (
                  <p className="text-xs text-muted-foreground">
                    This is your first time setting your name. After this, you can change it once every 15 days.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            /* ──────────── View Mode ──────────── */
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg">Profile Details</CardTitle>
                  <CardDescription>Your personal information</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEditing}
                  className="shrink-0 gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                {/* Profile Avatar + Name */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#283618] text-white text-xl font-bold">
                    {user?.name
                      ? user.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((n) => n[0]?.toUpperCase())
                          .join("")
                      : "?"}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#212121]">
                      {user?.name || "(No name set)"}
                    </h2>
                    {user?.role && (
                      <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#ece5c8]" />

                {/* Profile Details */}
                <div className="divide-y divide-[#f0f2f5]">
                  <ProfileDetailRow icon={Mail} label="Email" value={user?.email} />
                  {user?.school?.name && (
                    <ProfileDetailRow icon={School} label="School" value={user.school.name} />
                  )}
                  {batchesQuery.data && batchesQuery.data.length > 0 && (
                    <ProfileDetailRow
                      icon={Users}
                      label={batchesQuery.data.length === 1 ? "Batch" : "Batches"}
                      value={batchesQuery.data.map((b) => b.name).join(", ")}
                    />
                  )}
                  {!!user?.nameLastChangedAt && (
                    <ProfileDetailRow
                      icon={Calendar}
                      label="Name Last Changed"
                      value={format(new Date(user.nameLastChangedAt as string), "PPP")}
                    />
                  )}
                </div>

                {/* Restriction Notice */}
                {daysUntilNextChange !== null && daysUntilNextChange > 0 && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-orange-700">
                        Name change restricted for{" "}
                        <strong>{daysUntilNextChange} more day{daysUntilNextChange > 1 ? "s" : ""}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
