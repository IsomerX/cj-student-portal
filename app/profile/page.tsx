"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, AlertCircle, Loader2, User, Lock, Bell, Briefcase, Link as LinkIcon, Camera } from "lucide-react";
import { isAxiosError } from "axios";
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
import { updateUserName, updateUserProfilePic } from "@/lib/api/auth";
import { uploadFileToS3 } from "@/lib/api/files";
import { format, differenceInDays } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit.");
      return;
    }

    const userId = profileQuery.data?.id;
    if (!userId) {
      setUploadError("Profile not loaded. Cannot upload.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError("");
    setError("");
    setSuccess("");

    try {
      const uploadedFile = await uploadFileToS3({ file });
      if (!uploadedFile.downloadUrl) throw new Error("No URL returned from S3");

      await updateUserProfilePic(userId, uploadedFile.downloadUrl);

      setSuccess("Profile picture updated successfully!");
      profileQuery.refetch();

      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      setError("Please enter your first name");
      return;
    }

    if (newName === profileQuery.data?.name) {
      setError("New name is the same as current name");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    const newName = buildFullName();
    const userId = profileQuery.data?.id;

    if (!userId) {
      setError("Profile could not be loaded. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setShowConfirmDialog(false);

    try {
      await updateUserName(userId, newName);
      setSuccess("Name updated successfully!");
      profileQuery.refetch();

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
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
                {canChangeName && " You won't be able to change it again for 15 days."}
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

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden min-h-screen bg-[#f0f2f5] pb-20">
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
                  {user?.name ? "Last Name (Optional)" : "Enter Your Last Name (Optional)"}
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name (optional)"
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

      {/* DESKTOP LAYOUT (Mobbin Style) */}
      <div className="hidden lg:block mx-auto w-full max-w-full px-6 md:px-10 lg:px-12 pt-10 pb-20 mt-0">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-[#414141] transition-colors hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[28px] font-extrabold text-[#212121] tracking-tight">Profile Settings</h1>
          </div>
        </header>

        <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-8 sm:p-10 mb-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <h2 className="text-2xl font-bold text-[#212121]">General</h2>

            {/* Saving State */}
            {isSubmitting ? (
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#2d8c53] bg-[#f6fbf2] px-3 py-1.5 rounded-full border border-green-100">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving changes...
              </div>
            ) : success ? (
              <div className="flex items-center gap-2 text-[13px] font-bold text-[#2d8c53] bg-[#f6fbf2] px-3 py-1.5 rounded-full border border-green-100">
                <Check className="h-3.5 w-3.5" />
                Changes saved
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-100">
            <div className="h-[72px] w-[72px] shrink-0 rounded-full bg-[#212121] flex items-center justify-center overflow-hidden shadow-sm">
              {user?.profilePicUrl ? (
                <img src={user.profilePicUrl} alt="Avatar profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white uppercase tracking-wider">
                  {firstName ? firstName[0] : (user?.name ? user.name[0] : "S")}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-[#212121] text-[15px]">Profile photo</p>
              <p className="text-[13px] text-[#737373] mt-0.5 mb-3">We support PNGs, JPEGs and GIFs under 10MB</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="rounded-full h-8 px-4 text-xs font-bold text-[#212121] border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {isUploadingImage ? (
                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Uploading...</>
                ) : "Upload new picture"}
              </Button>
              <input
                type="file"
                accept="image/png, image/jpeg, image/gif"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="w-full mb-10 space-y-8">
            {/* Alerts */}
            {daysUntilNextChange !== null && daysUntilNextChange > 0 && (
              <div className="rounded-[16px] border border-orange-200 bg-orange-50 p-4">
                <div className="flex gap-4 items-start">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-900">Name change restricted</p>
                    <p className="text-sm text-orange-700 mt-1">
                      You can change your name again in <strong>{daysUntilNextChange} day{daysUntilNextChange > 1 ? "s" : ""}</strong>
                      {nextChangeDate && ` (on ${format(nextChangeDate, "PPP")})`}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {uploadError && (
              <div className="rounded-[16px] border border-red-200 bg-red-50 p-4 mb-6">
                <div className="flex gap-4 items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm font-bold text-red-900">{uploadError}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-[16px] border border-red-200 bg-red-50 p-4">
                <div className="flex gap-4 items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm font-bold text-red-900">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-bold text-[#212121]">First name</Label>
              <Input
                className="rounded-[12px] border-gray-300 h-[48px] px-4 shadow-sm focus:ring-[#283618] font-medium text-sm text-[#212121]"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                disabled={!canChangeName || isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-[#212121]">Last name</Label>
              <Input
                className="rounded-[12px] border-gray-300 h-[48px] px-4 shadow-sm focus:ring-[#283618] font-medium text-sm text-[#212121]"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setError(""); }}
                disabled={!canChangeName || isSubmitting}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-sm font-bold text-[#212121]">Email</Label>
              <div className="text-sm text-[#737373]">
                {user?.email || "No email available"}
              </div>
            </div>

            {!!user?.nameLastChangedAt && (
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-bold text-[#212121]">Last Changed</Label>
                <div className="text-sm text-[#737373]">
                  {format(new Date(user.nameLastChangedAt as string), "PPP")}
                </div>
              </div>
            )}

            {!user?.name && (
              <p className="text-xs text-[#737373] mt-2">
                This is your first time setting your name. After this, you can change it once every 15 days.
              </p>
            )}

            <div className="pt-4 flex justify-end sm:justify-start">
              <Button
                onClick={handleSubmit}
                disabled={!canChangeName || isSubmitting || !firstName.trim() || newFullName === user?.name}
                className="rounded-full font-bold bg-[#283618] hover:bg-[#1f2b13] px-8 h-10 w-full sm:w-auto text-[14px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin opacity-70" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
