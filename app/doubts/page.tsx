"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  CircleHelp,
  Eye,
  GraduationCap,
  Home,
  ImagePlus,
  Loader2,
  LogOut,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/custom-select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateDoubtMutation,
  useDoubtFeedQuery,
  useDoubtSubjectsQuery,
  useMyDoubtsQuery,
  useSimilarDoubtsQuery,
} from "@/hooks/use-doubts";
import { useFileUploadMutation } from "@/hooks/use-files";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";
import type { DoubtItem, SimilarDoubt } from "@/lib/api/doubts";
import { clearSession, getStoredToken } from "@/lib/auth/storage";
import { cn } from "@/lib/utils";

type PortalTab = "feed" | "mine";

type StatTileData = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

type DraftAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "AI_DRAFTED", label: "AI Drafted" },
  { value: "AWAITING_TEACHER", label: "Awaiting Teacher" },
  { value: "VERIFIED", label: "Verified" },
  { value: "RESOLVED", label: "Resolved" },
] as const;

const DOUBT_STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Open",
    className: "border-[#d7d8c8] bg-[#f5f5ef] text-[#63665d]",
  },
  AI_DRAFTED: {
    label: "AI Drafted",
    className: "border-[#ddd2f2] bg-[#f5efff] text-[#6b4fa2]",
  },
  AWAITING_TEACHER: {
    label: "Awaiting Teacher",
    className: "border-[#ecd7a6] bg-[#fff5dc] text-[#8a6914]",
  },
  VERIFIED: {
    label: "Verified",
    className: "border-[#c5e6cf] bg-[#edf8f0] text-[#1f7a43]",
  },
  AWAITING_FEEDBACK: {
    label: "Awaiting Feedback",
    className: "border-[#cadab2] bg-[#eef7e6] text-[#283618]",
  },
  RESOLVED: {
    label: "Resolved",
    className: "border-[#cfe6f5] bg-[#eef7fd] text-[#356985]",
  },
  ESCALATED: {
    label: "Escalated",
    className: "border-[#f2d5d1] bg-[#fff5f3] text-[#bf4d42]",
  },
  CLOSED: {
    label: "Closed",
    className: "border-[#ddd9d2] bg-[#f6f3ee] text-[#7b7468]",
  },
};

function getPortalTab(value: string | null): PortalTab {
  return value === "mine" ? "mine" : "feed";
}

function getFirstName(name?: string | null) {
  if (!name) return "Student";

  const firstName = name.trim().split(/\s+/)[0];
  return firstName || "Student";
}

function getReadableDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatRelativeDate(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function stripMarkdown(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/\$\$(.*?)\$\$/g, "$1")
    .replace(/\$(.*?)\$/g, "$1")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function StatusBadge({ status }: { status: string }) {
  const style = DOUBT_STATUS_STYLES[status] ?? DOUBT_STATUS_STYLES.OPEN;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}

function StatTile({ icon: Icon, label, value, helper }: StatTileData) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-[#ece5c8]/70 bg-white p-3 text-center shadow-sm sm:p-5 transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[12px] sm:rounded-[14px] bg-[#faf8ef] text-[#283618] ring-1 ring-[#ece5c8]/70">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#212121]">
        {value}
      </p>
      <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#737373]">
        {label}
      </p>
      <p className="mt-2 hidden text-xs font-medium leading-relaxed text-[#737373] sm:block">
        {helper}
      </p>
    </div>
  );
}

function DoubtCard({
  doubt,
  variant,
}: {
  doubt: DoubtItem;
  variant: PortalTab;
}) {
  const previewAnswer = stripMarkdown(doubt.verifiedAnswer || doubt.aiDraftAnswer);

  return (
    <Link href={`/doubts/${doubt.id}`} className="block">
      <article className="group cursor-pointer rounded-[24px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-[#ece5c8] transition-all hover:ring-[#cadab2] hover:shadow-md flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight text-[#212121] transition-colors group-hover:text-[#283618]">{doubt.title}</p>
              <p className="mt-1 text-[11px] font-medium text-[#a3a3a3]">
                {variant === "feed" ? "Class feed" : "My doubt"} · {formatRelativeDate(doubt.createdAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-center gap-1.5">
              <StatusBadge status={doubt.status} />
            </div>
          </div>

          {doubt.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5f615a]">
              {stripMarkdown(doubt.description)}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {doubt.subject?.name ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#283618] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
                <BookOpen className="h-3 w-3" />
                {doubt.subject.name}
              </span>
            ) : null}
            {doubt.attachmentUrls && doubt.attachmentUrls.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5dc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a6914] ring-1 ring-[#ecd7a6]">
                <Paperclip className="h-3 w-3" />
                {doubt.attachmentUrls.length} image{doubt.attachmentUrls.length > 1 ? "s" : ""}
              </span>
            ) : null}
            {typeof doubt.viewCount === "number" && doubt.viewCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f7f1] px-2 py-0.5 text-[10px] font-bold text-[#283618] ring-1 ring-[#cadab2]">
                <Eye className="h-3 w-3" />
                {doubt.viewCount} views
              </span>
            ) : null}
            {doubt.detectedTopic ? (
              <span className="inline-flex items-center rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] text-[#737373]">
                {doubt.detectedTopic}
              </span>
            ) : null}
          </div>
        </div>

        {previewAnswer ? (
          <div className="mt-4 rounded-[16px] bg-[#fdfcfa] p-4 ring-1 ring-[#ece5c8]/60 relative z-0">
            <div className="absolute -left-[1px] top-4 bottom-4 w-1 rounded-r-full bg-[#c4a57b]" />
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c4a57b]/10 text-[#c4a57b]">
                <Brain className="h-3 w-3" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a3a3a3]">
                {doubt.verifiedAnswer ? "Verified Answer" : "AI Draft"}
              </p>
            </div>
            <p className="line-clamp-2 text-sm leading-relaxed text-[#414141] font-medium">{previewAnswer}</p>
          </div>
        ) : null}
      </article>
    </Link>
  );
}

function SimilarDoubtCard({ doubt }: { doubt: SimilarDoubt }) {
  const previewAnswer = stripMarkdown(doubt.verifiedAnswer || doubt.aiDraftAnswer);

  return (
    <article className="rounded-[20px] border-2 border-[#d9ead0]/70 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f6fbf2] text-[#2d8c53] ring-1 ring-[#d9ead0]">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 border-b border-[#ece5c8]/40 pb-3 mb-3">
            <p className="text-sm font-bold leading-tight text-[#212121]">{doubt.title}</p>
            <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[10px] font-extrabold text-[#1f7a43]">
              {Math.round(doubt.similarity * 100)}% match
            </span>
          </div>
          {previewAnswer ? (
            <p className="line-clamp-2 text-xs leading-5 text-[#5f615a] font-medium">{previewAnswer}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#ece5c8] bg-[#faf8ef] px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#283618] ring-1 ring-[#ece5c8]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-base font-bold text-[#212121]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#737373]">
        {description}
      </p>
      <Button type="button" className="mt-5" onClick={onAction}>
        {actionLabel}
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SectionError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#f2d5d1] bg-[#fff5f3] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#bf4d42] ring-1 ring-[#f2d5d1]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#212121]">{title}</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#737373]">
              {message}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}

function PortalLoadingState() {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-36 sm:pb-12">
      <section className="h-56 w-full animate-pulse rounded-b-[32px] bg-[#283618] sm:h-64 sm:rounded-b-[40px]" />
      <div className="mx-auto -mt-8 max-w-6xl px-3 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          <div className="h-32 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
          <div className="h-[420px] rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}

function CreateDoubtDrawer({
  open,
  onOpenChange,
  subjectOptions,
  subjectsError,
  subjectsLoading,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectOptions: Array<{ value: string; label: string }>;
  subjectsError: string | null;
  subjectsLoading: boolean;
  onCreated: () => void;
}) {
  const [askSubjectId, setAskSubjectId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  const [formErrors, setFormErrors] = React.useState<{
    subject?: string;
    title?: string;
    description?: string;
  }>({});
  const [formNotice, setFormNotice] = React.useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [attachments, setAttachments] = React.useState<DraftAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<{
    current: number;
    total: number;
    progress: number;
  } | null>(null);

  const deferredDescription = React.useDeferredValue(description.trim());
  const similarDoubtsQuery = useSimilarDoubtsQuery(deferredDescription);
  const createDoubtMutation = useCreateDoubtMutation();
  const uploadFileMutation = useFileUploadMutation();
  const attachmentsRef = React.useRef<DraftAttachment[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && !askSubjectId && subjectOptions.length === 1) {
      setAskSubjectId(subjectOptions[0].value);
    }
  }, [askSubjectId, open, subjectOptions]);

  React.useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  React.useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  const resetForm = React.useCallback(() => {
    attachmentsRef.current.forEach((attachment) => {
      URL.revokeObjectURL(attachment.previewUrl);
    });
    setAskSubjectId(subjectOptions.length === 1 ? subjectOptions[0].value : "");
    setTitle("");
    setDescription("");
    setIsPublic(true);
    setFormErrors({});
    setFormNotice(null);
    setAttachments([]);
    setUploadProgress(null);
  }, [subjectOptions]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFormErrors({});
      setFormNotice(null);
      setUploadProgress(null);
    }
  };

  const handleAttachmentSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const currentCount = attachmentsRef.current.length;
    const remainingSlots = Math.max(0, 3 - currentCount);

    if (remainingSlots === 0) {
      setFormNotice({
        tone: "error",
        message: "You can upload up to 3 images for a doubt.",
      });
      return;
    }

    const validFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length !== selectedFiles.length) {
      setFormNotice({
        tone: "error",
        message: "Only image files can be attached to a doubt.",
      });
    }

    const nextAttachments = validFiles.slice(0, remainingSlots).map((file) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${file.name}-${file.lastModified}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (nextAttachments.length === 0) {
      return;
    }

    if (validFiles.length > remainingSlots) {
      setFormNotice({
        tone: "error",
        message: "Only the first 3 images were kept for this doubt.",
      });
    }

    setAttachments((current) => [...current, ...nextAttachments]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === attachmentId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});
    setFormNotice(null);

    const nextErrors: typeof formErrors = {};
    if (!askSubjectId) {
      nextErrors.subject = "Select a subject before submitting.";
    }
    if (!title.trim()) {
      nextErrors.title = "Enter a short title for your doubt.";
    }
    if (!description.trim()) {
      nextErrors.description = "Describe the doubt in enough detail for a useful answer.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      let attachmentUrls: string[] | undefined;

      if (attachmentsRef.current.length > 0) {
        attachmentUrls = [];

        for (const [index, attachment] of attachmentsRef.current.entries()) {
          setUploadProgress({
            current: index + 1,
            total: attachmentsRef.current.length,
            progress: 0,
          });

          const uploadedFile = await uploadFileMutation.mutateAsync({
            file: attachment.file,
            onUploadProgress: (progress) => {
              setUploadProgress({
                current: index + 1,
                total: attachmentsRef.current.length,
                progress,
              });
            },
          });

          if (!uploadedFile.downloadUrl) {
            throw new Error("One of the images could not be uploaded.");
          }

          setUploadProgress({
            current: index + 1,
            total: attachmentsRef.current.length,
            progress: 100,
          });
          attachmentUrls.push(uploadedFile.downloadUrl);
        }
      }

      await createDoubtMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        subjectId: askSubjectId,
        source: attachmentUrls && attachmentUrls.length > 0 ? "IMAGE" : "TEXT",
        attachmentUrls,
        isPublic,
      });

      setUploadProgress(null);
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (error) {
      setUploadProgress(null);
      setFormNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "We could not submit your doubt.",
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="p-0">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <DrawerHeader className="pr-8">
            <DrawerTitle>Create new doubt</DrawerTitle>
            <DrawerDescription>
              Write the question clearly and the portal will check for similar solved doubts
              before you submit.
            </DrawerDescription>
          </DrawerHeader>

          <form id="create-doubt-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#414141]">Subject</label>
              <CustomSelect
                value={askSubjectId}
                onChange={(value) => {
                  setAskSubjectId(value);
                  setFormErrors((current) => ({ ...current, subject: undefined }));
                }}
                options={subjectOptions}
                placeholder={subjectsError ? "Subjects unavailable" : "Select a subject"}
                error={Boolean(formErrors.subject)}
                disabled={subjectsLoading || Boolean(subjectsError)}
              />
              {formErrors.subject ? (
                <p className="text-sm font-medium text-red-600">{formErrors.subject}</p>
              ) : null}
              {subjectsError ? (
                <p className="text-sm font-medium text-red-600">{subjectsError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#414141]">Title</label>
              <Input
                value={title}
                onValueChange={(value) => {
                  setTitle(value);
                  setFormErrors((current) => ({ ...current, title: undefined }));
                }}
                placeholder="Brief title for your doubt"
                clearable
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title ? (
                <p className="text-sm font-medium text-red-600">{formErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#414141]">Description</label>
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setFormErrors((current) => ({ ...current, description: undefined }));
                }}
                placeholder="Describe your doubt in detail. Include what you tried and where you got stuck."
                aria-invalid={Boolean(formErrors.description)}
                className={cn(
                  "min-h-[148px] w-full rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-[#414141] shadow-sm outline-none transition-all placeholder:text-[#a3a3a3]",
                  "focus:border-[#283618] focus:ring-2 focus:ring-[#283618]/20",
                  "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
                )}
              />
              {formErrors.description ? (
                <p className="text-sm font-medium text-red-600">{formErrors.description}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-semibold text-[#414141]">
                    Images
                  </label>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#737373]">
                    Add up to 3 images, just like the mobile doubt flow.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentSelection}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 3 || createDoubtMutation.isPending || uploadFileMutation.isPending}
                >
                  <ImagePlus className="h-4 w-4" />
                  Add image
                </Button>
              </div>

              {attachments.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative overflow-hidden rounded-[18px] border border-[#ece5c8] bg-[#faf8ef]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.file.name}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                        aria-label={`Remove ${attachment.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="border-t border-[#ece5c8] px-3 py-2">
                        <p className="truncate text-[11px] font-semibold text-[#414141]">
                          {attachment.file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#ece5c8] bg-[#faf8ef] px-4 py-4 text-sm font-medium text-[#737373]">
                  No images attached yet.
                </div>
              )}

              {uploadProgress ? (
                <div className="rounded-[18px] border border-[#ece5c8] bg-[#faf8ef] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#414141]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#283618]" />
                    Uploading image {uploadProgress.current} of {uploadProgress.total}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6e1d2]">
                    <div
                      className="h-full rounded-full bg-[#283618] transition-all"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#414141]">Visibility</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    "rounded-[18px] border px-4 py-3 text-left transition-all",
                    isPublic
                      ? "border-[#cadab2] bg-[#eef7e6] text-[#283618]"
                      : "border-[#ece5c8] bg-[#faf8ef] text-[#737373]",
                  )}
                >
                  <p className="text-sm font-bold">Visible in class feed</p>
                  <p className="mt-1 text-xs font-medium leading-5">
                    Let classmates learn from the same question.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    "rounded-[18px] border px-4 py-3 text-left transition-all",
                    !isPublic
                      ? "border-[#cadab2] bg-[#eef7e6] text-[#283618]"
                      : "border-[#ece5c8] bg-[#faf8ef] text-[#737373]",
                  )}
                >
                  <p className="text-sm font-bold">Keep it private</p>
                  <p className="mt-1 text-xs font-medium leading-5">
                    Only your teacher-side workflow will see it.
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#283618] ring-1 ring-[#ece5c8]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#212121]">Similar doubt check</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#737373]">
                    As soon as your description has enough detail, matching answers will show up
                    here.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {similarDoubtsQuery.isLoading ? (
                  <p className="text-sm font-medium text-[#737373]">
                    Checking similar doubts...
                  </p>
                ) : similarDoubtsQuery.data && similarDoubtsQuery.data.length > 0 ? (
                  similarDoubtsQuery.data.slice(0, 3).map((doubt) => (
                    <SimilarDoubtCard key={doubt.id} doubt={doubt} />
                  ))
                ) : deferredDescription.length >= 20 ? (
                  <div className="rounded-[16px] border border-[#d9ead0] bg-[#f6fbf2] px-4 py-3 text-sm font-medium text-[#2d8c53]">
                    No close match found. This looks ready to submit as a new doubt.
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-[#ece5c8] bg-white px-4 py-3 text-sm font-medium text-[#737373]">
                    Start describing the problem to unlock suggestions.
                  </div>
                )}
              </div>
            </div>

            {formNotice ? (
              <div
                className={cn(
                  "rounded-[18px] border p-4 text-sm font-medium",
                  formNotice.tone === "success"
                    ? "border-[#c5e6cf] bg-[#edf8f0] text-[#1f7a43]"
                    : "border-[#f2d5d1] bg-[#fff5f3] text-[#bf4d42]",
                )}
              >
                {formNotice.message}
              </div>
            ) : null}

          </form>
        </div>
        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createDoubtMutation.isPending || uploadFileMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-doubt-form"
            disabled={createDoubtMutation.isPending || uploadFileMutation.isPending}
            className="sm:min-w-[180px]"
          >
            {uploadFileMutation.isPending
              ? "Uploading..."
              : createDoubtMutation.isPending
                ? "Submitting..."
                : "Submit doubt"}
            {uploadFileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DoubtsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const logoutMutation = useLogoutMutation();

  const [activeTab, setActiveTab] = React.useState<PortalTab>(
    getPortalTab(searchParams.get("tab")),
  );
  const [browseStatus, setBrowseStatus] = React.useState("ALL");
  const [browseSubjectId, setBrowseSubjectId] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [pageNotice, setPageNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (requestedTab === "ask") {
      setIsCreateOpen(true);
      setActiveTab("feed");
      router.replace("/doubts");
      return;
    }

    setActiveTab(getPortalTab(requestedTab));
  }, [router, searchParams]);

  React.useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  React.useEffect(() => {
    if (profileQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [profileQuery.isError, router]);

  const user = profileQuery.data;
  const classSectionId =
    typeof user?.["classSectionId"] === "string" ? user["classSectionId"] : undefined;

  const subjectsQuery = useDoubtSubjectsQuery(classSectionId);
  const feedQuery = useDoubtFeedQuery({
    status: browseStatus !== "ALL" ? browseStatus : undefined,
    subjectId: browseSubjectId || undefined,
    limit: 12,
  });
  const myDoubtsQuery = useMyDoubtsQuery({
    status: browseStatus !== "ALL" ? browseStatus : undefined,
    subjectId: browseSubjectId || undefined,
    page: 1,
    limit: 12,
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const isLoading =
    profileQuery.isLoading ||
    (subjectsQuery.isLoading && !subjectsQuery.data) ||
    (feedQuery.isLoading && !feedQuery.data) ||
    (myDoubtsQuery.isLoading && !myDoubtsQuery.data);

  if (!token) {
    return null;
  }

  if (isLoading) {
    return <PortalLoadingState />;
  }

  const studentName = getFirstName(user?.name);
  const readableDate = getReadableDate();
  const subjectOptions = (subjectsQuery.data ?? []).map((subject) => ({
    value: subject.id,
    label: subject.name,
  }));
  const browseSubjectOptions = [
    { value: "", label: "All subjects" },
    ...subjectOptions,
  ];

  const feedItems = feedQuery.data?.doubts ?? [];
  const myItems = myDoubtsQuery.data?.doubts ?? [];
  const totalMyDoubts = myDoubtsQuery.data?.total ?? 0;
  const hasAnyDoubts = totalMyDoubts > 0 || feedItems.length > 0;
  const openCount = myItems.filter(
    (item) => item.status !== "RESOLVED" && item.status !== "CLOSED",
  ).length;
  const answeredCount = [...myItems, ...feedItems].filter(
    (item) => Boolean(item.verifiedAnswer || item.aiDraftAnswer),
  ).length;
  const statTiles: StatTileData[] = [
    {
      label: "My doubts",
      value: String(totalMyDoubts),
      helper: totalMyDoubts > 0 ? "Questions you have already raised." : "No doubts yet.",
      icon: CircleHelp,
    },
    {
      label: "In progress",
      value: String(openCount),
      helper: openCount > 0 ? "Still waiting for clarification or review." : "Nothing pending now.",
      icon: Bell,
    },
    {
      label: "Answered",
      value: String(answeredCount),
      helper: answeredCount > 0 ? "Solved answers available to revisit." : "Answers will show up here.",
      icon: ShieldCheck,
    },
  ];

  const feedError = feedQuery.error instanceof Error ? feedQuery.error.message : null;
  const myError = myDoubtsQuery.error instanceof Error ? myDoubtsQuery.error.message : null;
  const subjectsError =
    subjectsQuery.error instanceof Error ? subjectsQuery.error.message : null;

  return (
    <>
      <main className="min-h-[100dvh] bg-[#f0f2f5] pb-36 sm:pb-12">
        <section className="rounded-b-[32px] bg-[#283618] px-3 pb-14 pt-5 shadow-lg sm:rounded-b-[40px] sm:px-6 sm:pb-16 sm:pt-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[#283618] ring-2 ring-white/10 sm:h-12 sm:w-12 sm:rounded-[16px]">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-[10px]">
                    Student Portal
                  </p>
                  <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
                    CJ Coaching
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:text-sm"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="h-9 shrink-0 rounded-[12px] border-0 bg-white/10 px-3 text-white backdrop-blur-md hover:bg-white/20 hover:text-white focus:ring-2 focus:ring-white/50"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                  </span>
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#cadab2]">
                  Doubt Portal
                </p>
                <h1 className="mt-2 text-[1.9rem] font-extrabold leading-tight tracking-tight text-white sm:text-[2.4rem]">
                  Ask when you are stuck.
                </h1>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                  {studentName}, check the class feed or create a new doubt for {readableDate}.
                </p>
              </div>

              <Button
                type="button"
                className="hidden sm:inline-flex"
                onClick={() => setIsCreateOpen(true)}
              >
                Create new doubt
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto -mt-6 max-w-6xl px-3 sm:px-6 lg:px-8">
          {hasAnyDoubts ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {statTiles.map((tile) => (
                <StatTile key={tile.label} {...tile} />
              ))}
            </div>
          ) : null}

          <section className={cn("w-full", hasAnyDoubts ? "mt-6 sm:mt-8" : "mt-2")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
                  Browse
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#212121]">Doubt feed</h2>
                <p className="mt-1 text-sm font-medium leading-relaxed text-[#737373]">
                  Keep the main screen focused: browse doubts here and create a new one only when
                  you need it.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => setIsCreateOpen(true)}
              >
                Create new doubt
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {pageNotice ? (
              <div className="mt-4 rounded-[18px] border border-[#c5e6cf] bg-[#edf8f0] px-4 py-3 text-sm font-medium text-[#1f7a43]">
                {pageNotice}
              </div>
            ) : null}

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as PortalTab)}
              className="mt-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-[18px] bg-[#f3f4ee] p-1 sm:w-auto">
                  <TabsTrigger value="feed" className="rounded-[14px] px-4 py-2.5 text-sm font-bold">
                    Feed
                  </TabsTrigger>
                  <TabsTrigger value="mine" className="rounded-[14px] px-4 py-2.5 text-sm font-bold">
                    My doubts
                  </TabsTrigger>
                </TabsList>

                {hasAnyDoubts ? (
                  <div className="grid grid-cols-2 gap-2 sm:w-full sm:max-w-[420px]">
                    <CustomSelect
                      value={browseStatus}
                      onChange={setBrowseStatus}
                      options={STATUS_OPTIONS.map((item) => ({
                        value: item.value,
                        label: item.label,
                      }))}
                      placeholder="All statuses"
                    />
                    <CustomSelect
                      value={browseSubjectId}
                      onChange={setBrowseSubjectId}
                      options={browseSubjectOptions}
                      placeholder="All subjects"
                    />
                  </div>
                ) : null}
              </div>

              <TabsContent value="feed" className="mt-4">
                {feedError ? (
                  <SectionError
                    title="Feed unavailable"
                    message={feedError}
                    onRetry={() => {
                      void feedQuery.refetch();
                    }}
                  />
                ) : feedItems.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {feedItems.map((doubt) => (
                      <DoubtCard key={doubt.id} doubt={doubt} variant="feed" />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Bell}
                    title="No doubts in the feed yet"
                    description="When questions start coming in, this space will stay focused on them. Until then, create the first doubt."
                    actionLabel="Create new doubt"
                    onAction={() => setIsCreateOpen(true)}
                  />
                )}
              </TabsContent>

              <TabsContent value="mine" className="mt-4">
                {myError ? (
                  <SectionError
                    title="My doubts unavailable"
                    message={myError}
                    onRetry={() => {
                      void myDoubtsQuery.refetch();
                    }}
                  />
                ) : myItems.length > 0 ? (
                  <div className="space-y-3">
                    {myItems.map((doubt) => (
                      <DoubtCard key={doubt.id} doubt={doubt} variant="mine" />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CircleHelp}
                    title="You have not raised any doubts yet"
                    description="Keep this screen light. When you need help, create a doubt and it will show up here."
                    actionLabel="Create new doubt"
                    onAction={() => setIsCreateOpen(true)}
                  />
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <div className="fixed bottom-[76px] left-0 right-0 z-40 px-4 sm:hidden">
          <Button type="button" className="w-full" onClick={() => setIsCreateOpen(true)}>
            Create new doubt
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#ece5c8] bg-white/90 px-2 pt-2 backdrop-blur-lg sm:hidden">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
              <Home className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/doubts" className="flex flex-col items-center gap-1 p-2 text-[#283618]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef7e6]">
              <CircleHelp className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold">Doubts</span>
          </Link>
          <Link
            href="/ai"
            className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Dost AI</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 p-2 text-[#737373] transition-colors hover:text-[#283618]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#faf8ef]">
              <User className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </nav>
      </main>

      <CreateDoubtDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        subjectOptions={subjectOptions}
        subjectsError={subjectsError}
        subjectsLoading={subjectsQuery.isLoading}
        onCreated={() => {
          setPageNotice("Your doubt has been created and added to your portal.");
          setActiveTab("mine");
        }}
      />
    </>
  );
}

export default function DoubtsPage() {
  return (
    <React.Suspense fallback={<PortalLoadingState />}>
      <DoubtsPageContent />
    </React.Suspense>
  );
}
