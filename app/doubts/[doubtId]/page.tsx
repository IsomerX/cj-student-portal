"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  GraduationCap,
  Home,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Send,
  ShieldCheck,
  Star,
  User,
  UserCheck,
  Video,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  useAddDoubtMessageMutation,
  useDoubtDetailQuery,
  useDoubtMessagesQuery,
  useRateDoubtMutation,
  useSimilarDoubtsByIdQuery,
} from "@/hooks/use-doubts";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";
import type {
  DoubtMessage,
  SimilarDoubt,
} from "@/lib/api/doubts";
import { clearSession, getStoredToken } from "@/lib/auth/storage";
import { cn } from "@/lib/utils";

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

function formatDetailedDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMessageTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
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

function getAttachmentType(url: string): "image" | "audio" | "video" | "document" {
  const path = (url.split("?")[0] || "").toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(path)) return "image";
  if (/\.(mp3|wav|ogg|aac|m4a|webm)$/.test(path)) return "audio";
  if (/\.(mp4|mov|avi|mkv)$/.test(path)) return "video";
  return "document";
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

function MetaChip({
  icon: Icon,
  label,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-[#ece5c8] sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
          {title}
        </p>
        {description ? (
          <p className="mt-2 text-sm font-medium leading-6 text-[#737373]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function RichText({ content, className }: { content?: string | null; className?: string }) {
  if (!content) {
    return null;
  }

  return (
    <div className={cn("whitespace-pre-wrap break-words text-sm leading-7 text-[#4f514b]", className)}>
      {content}
    </div>
  );
}

function AttachmentGallery({
  attachments,
  onImageOpen,
}: {
  attachments: string[];
  onImageOpen: (url: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]">
        Attachments
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {attachments.map((url, index) => {
          const attachmentType = getAttachmentType(url);

          if (attachmentType === "image") {
            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => onImageOpen(url)}
                className="group overflow-hidden rounded-[20px] bg-[#faf8ef] text-left ring-1 ring-[#ece5c8] transition-all hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Doubt attachment ${index + 1}`}
                  className="h-52 w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-[#212121]">
                    Image {index + 1}
                  </span>
                  <span className="text-xs font-medium text-[#737373]">Tap to view</span>
                </div>
              </button>
            );
          }

          if (attachmentType === "audio") {
            return (
              <div
                key={`${url}-${index}`}
                className="rounded-[20px] bg-[#faf8ef] p-4 ring-1 ring-[#ece5c8]"
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#212121]">
                  <Volume2 className="h-4 w-4 text-[#283618]" />
                  Audio {index + 1}
                </div>
                <audio controls className="w-full">
                  <source src={url} />
                </audio>
              </div>
            );
          }

          if (attachmentType === "video") {
            return (
              <div
                key={`${url}-${index}`}
                className="rounded-[20px] bg-[#faf8ef] p-4 ring-1 ring-[#ece5c8]"
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#212121]">
                  <Video className="h-4 w-4 text-[#283618]" />
                  Video {index + 1}
                </div>
                <video controls className="w-full rounded-[16px] bg-black">
                  <source src={url} />
                </video>
              </div>
            );
          }

          return (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-[20px] bg-[#faf8ef] p-4 ring-1 ring-[#ece5c8] transition-colors hover:bg-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[#283618] ring-1 ring-[#ece5c8]">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#212121]">
                  Document {index + 1}
                </p>
                <p className="truncate text-xs font-medium text-[#737373]">{url}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}



function MessageBubble({
  message,
  onImageOpen,
}: {
  message: DoubtMessage;
  onImageOpen: (url: string) => void;
}) {
  const isStudent = message.senderType === "STUDENT";
  const isAi = message.senderType === "AI";
  const senderLabel = isStudent
    ? "You"
    : isAi
      ? "AI Assistant"
      : message.sender?.name || "Teacher";

  return (
    <div className={cn("flex", isStudent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-[20px] px-4 py-3 sm:max-w-[78%]",
          isStudent
            ? "bg-[#283618] text-white"
            : isAi
              ? "bg-[#faf5ff] text-[#414141] ring-1 ring-[#eadcfb]"
              : "bg-[#faf8ef] text-[#414141] ring-1 ring-[#ece5c8]",
        )}
      >
        {!isStudent ? (
          <p
            className={cn(
              "mb-1 text-[11px] font-bold uppercase tracking-[0.14em]",
              isAi ? "text-[#8b5cf6]" : "text-[#283618]",
            )}
          >
            {senderLabel}
          </p>
        ) : null}

        {message.content ? (
          <RichText
            content={message.content}
            className={cn(
              "text-sm leading-6",
              isStudent ? "text-white" : "text-[#4f514b]",
            )}
          />
        ) : null}

        {message.attachmentUrls && message.attachmentUrls.length > 0 ? (
          <div className="mt-3 space-y-2">
            {message.attachmentUrls.map((url, index) => {
              const attachmentType = getAttachmentType(url);

              if (attachmentType === "image") {
                return (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => onImageOpen(url)}
                    className="overflow-hidden rounded-[16px] bg-white/10 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Message attachment ${index + 1}`}
                      className="h-44 w-full object-cover"
                    />
                  </button>
                );
              }

              if (attachmentType === "audio") {
                return (
                  <audio key={`${url}-${index}`} controls className="w-full">
                    <source src={url} />
                  </audio>
                );
              }

              if (attachmentType === "video") {
                return (
                  <video
                    key={`${url}-${index}`}
                    controls
                    className="w-full rounded-[16px] bg-black"
                  >
                    <source src={url} />
                  </video>
                );
              }

              return (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold",
                    isStudent ? "bg-white/10 text-white" : "bg-white text-[#414141]",
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Document {index + 1}
                </a>
              );
            })}
          </div>
        ) : null}

        <p
          className={cn(
            "mt-2 text-[11px] font-medium",
            isStudent ? "text-white/70" : "text-[#8a8d86]",
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function SimilarDoubtCard({ doubt }: { doubt: SimilarDoubt }) {
  return (
    <Link
      href={`/doubts/${doubt.id}`}
      className="group rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-[#ece5c8] transition-all hover:shadow-md hover:ring-[#cadab2]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-6 text-[#212121] group-hover:text-[#283618]">
            {doubt.title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#737373]">
            {stripMarkdown(doubt.verifiedAnswer || doubt.aiDraftAnswer)}
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-[#eef7e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#283618]">
          {Math.round(doubt.similarity * 100)}%
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={doubt.status} />
        <ChevronRight className="h-4 w-4 text-[#bbb19d]" />
      </div>
    </Link>
  );
}

function ResolveCard({
  submitting,
  existingRating,
  existingFeedback,
  onSubmit,
}: {
  submitting: boolean;
  existingRating?: number | null;
  existingFeedback?: string | null;
  onSubmit: (rating: number, feedback?: string) => Promise<void> | void;
}) {
  const [rating, setRating] = React.useState(existingRating ?? 0);
  const [feedback, setFeedback] = React.useState(existingFeedback ?? "");

  React.useEffect(() => {
    setRating(existingRating ?? 0);
    setFeedback(existingFeedback ?? "");
  }, [existingFeedback, existingRating]);

  if (existingRating) {
    return (
      <div className="rounded-[24px] bg-[#faf8ef] p-5 ring-1 ring-[#ece5c8]">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[#c08b17] ring-1 ring-[#ece5c8]">
            <Star className="h-4 w-4 fill-current" />
          </div>
          <div>
            <p className="text-base font-bold text-[#212121]">Resolved with your feedback</p>
            <p className="text-sm font-medium text-[#737373]">
              This doubt has already been rated and marked as resolved.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-5 w-5",
                star <= existingRating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#d7d8c8]",
              )}
            />
          ))}
        </div>

        {existingFeedback ? (
          <div className="mt-4 rounded-[18px] bg-white p-4 ring-1 ring-[#ece5c8]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#737373]">
              Your feedback
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#4f514b]">
              {existingFeedback}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-[#ece5c8]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fffcf5] text-[#c08b17] ring-1 ring-[#ece5c8]">
          <Star className="h-4 w-4" />
        </div>
        <div>
          <p className="text-base font-bold text-[#212121]">Rate and resolve</p>
          <p className="mt-1 text-sm font-medium leading-6 text-[#737373]">
            Submitting your rating will close the discussion and mark the doubt as resolved.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 sm:justify-start">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= rating;

          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="rounded-full p-1.5 transition-transform hover:scale-105"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-8 w-8",
                  isActive ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#d7d8c8]",
                )}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        placeholder="Optional feedback..."
        className="mt-5 min-h-[104px] w-full rounded-[18px] border border-[#ece5c8] bg-white px-4 py-3 text-sm text-[#414141] outline-none transition-all placeholder:text-[#a3a3a3] focus:border-[#c08b17] focus:ring-2 focus:ring-[#f59e0b]/20"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium leading-5 text-[#737373]">
          Once submitted, chat will close and the doubt will move to resolved.
        </p>
        <Button
          type="button"
          onClick={() => void onSubmit(rating, feedback.trim() || undefined)}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" />
          )}
          {submitting ? "Submitting..." : "Submit rating"}
        </Button>
      </div>
    </div>
  );
}

function DetailLoadingState() {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-24 sm:pb-12">
      <section className="h-48 animate-pulse rounded-b-[32px] bg-[#283618] sm:h-56 sm:rounded-b-[40px]" />
      <div className="mx-auto -mt-8 max-w-5xl px-3 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-40 rounded-[24px] bg-white shadow-sm ring-1 ring-[#ece5c8]" />
          <div className="h-72 rounded-[24px] bg-white shadow-sm ring-1 ring-[#ece5c8]" />
          <div className="h-80 rounded-[24px] bg-white shadow-sm ring-1 ring-[#ece5c8]" />
        </div>
      </div>
    </main>
  );
}

function ErrorState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-[#ece5c8]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#fff5f3] text-[#bf4d42] ring-1 ring-[#f2d5d1]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="mt-4 text-lg font-bold text-[#212121]">{title}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#737373]">{message}</p>
        <Button className="mt-5" asChild>
          <Link href="/doubts">Back to doubts</Link>
        </Button>
      </div>
    </main>
  );
}

export default function DoubtDetailPage() {
  const router = useRouter();
  const params = useParams<{ doubtId: string }>();
  const doubtId = Array.isArray(params.doubtId) ? params.doubtId[0] : params.doubtId;
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const logoutMutation = useLogoutMutation();

  const [messageDraft, setMessageDraft] = React.useState("");
  const [showAiDraft, setShowAiDraft] = React.useState(false);
  const [showVerified, setShowVerified] = React.useState(true);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

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

  const detailQuery = useDoubtDetailQuery(doubtId);
  const doubt = detailQuery.data;
  const currentUserId = profileQuery.data?.id;
  const isOwner = Boolean(doubt && currentUserId && doubt.student?.id === currentUserId);
  const canChat =
    isOwner &&
    Boolean(doubt) &&
    !["RESOLVED", "AWAITING_FEEDBACK", "CLOSED"].includes(doubt?.status ?? "");

  const messagesQuery = useDoubtMessagesQuery(doubtId, {
    enabled: isOwner,
    refetchInterval:
      canChat || (isOwner && doubt?.status === "VERIFIED") ? 10000 : false,
  });
  const similarDoubtsQuery = useSimilarDoubtsByIdQuery(doubtId);
  const addMessageMutation = useAddDoubtMessageMutation(doubtId);
  const rateDoubtMutation = useRateDoubtMutation(doubtId);

  const visibleMessages = React.useMemo(() => {
    const messages = messagesQuery.data ?? [];
    return messages;
  }, [messagesQuery.data]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const handleSendMessage = async () => {
    const content = messageDraft.trim();

    if (!content || !canChat) {
      return;
    }

    try {
      await addMessageMutation.mutateAsync({ content });
      setMessageDraft("");
    } catch {
      return;
    }
  };

  const handleResolve = async (rating: number, feedback?: string) => {
    if (!isOwner) {
      return;
    }

    try {
      await rateDoubtMutation.mutateAsync({ rating, feedback });
    } catch {
      return;
    }
  };

  if (!token) {
    return null;
  }

  if (profileQuery.isLoading || detailQuery.isLoading) {
    return <DetailLoadingState />;
  }

  if (detailQuery.isError || !doubt) {
    const message =
      detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "We could not load this doubt.";

    return <ErrorState title="Doubt unavailable" message={message} />;
  }

  const hasVerifiedAnswer = Boolean(doubt.verifiedAnswer);
  const hasAiDraft = Boolean(doubt.aiDraftAnswer) && !hasVerifiedAnswer;
  const isResolved = doubt.status === "RESOLVED" || doubt.status === "CLOSED";
  const canRateAndResolve =
    isOwner &&
    hasVerifiedAnswer &&
    ["VERIFIED", "AWAITING_FEEDBACK", "RESOLVED"].includes(doubt.status);
  const viewerLabel = isOwner ? "Asked by you" : "Shared from class feed";
  const chatDisabledReason = !isOwner
    ? "Discussion is available only to the student who created this doubt."
    : isResolved
      ? "This doubt is already resolved, so the discussion is now closed."
      : doubt.status === "AWAITING_FEEDBACK"
        ? "Chat is paused while the doubt is awaiting your feedback."
        : "Chat is not available right now.";

  return (
    <>
      <main className="min-h-[100dvh] bg-[#f0f2f5] pb-48 sm:pb-24">
        <section className="rounded-b-[24px] bg-[#283618] px-3 pb-6 pt-3 shadow-sm sm:rounded-b-[32px] sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#283618] ring-2 ring-white/10 sm:h-10 sm:w-10">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-[10px]">
                    Doubt Detail
                  </p>
                  <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
                    CJ Coaching
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/doubts"
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="hidden h-9 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:inline-flex sm:text-sm"
                >
                  <Home className="h-4 w-4" />
                  Home
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

            <div className="mt-6 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <MetaChip
                  label={viewerLabel}
                  className="bg-white/10 text-white ring-1 ring-white/20"
                />
                <StatusBadge status={doubt.status} />
              </div>

              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                {doubt.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] sm:text-xs">
                {doubt.subject?.name ? (
                  <MetaChip
                    icon={BookOpen}
                    label={doubt.subject.name}
                    className="bg-black/20 text-[#cadab2] ring-0"
                  />
                ) : null}
                {doubt.detectedDifficulty ? (
                  <MetaChip
                    label={doubt.detectedDifficulty}
                    className="bg-white/10 text-white ring-1 ring-white/20"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-4 max-w-5xl px-3 sm:px-6 lg:px-8">
          <Tabs defaultValue={canChat ? "discussion" : "overview"} className="w-full">
            <div className="sticky top-0 z-30 -mx-3 mb-5 bg-[#f0f2f5]/90 px-3 py-2 backdrop-blur-xl sm:mx-0 sm:px-0 sm:pb-4 sm:pt-0">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-[16px] bg-white/60 p-1.5 shadow-sm ring-1 ring-[#ece5c8]">
                <TabsTrigger
                  value="discussion"
                  className="rounded-[12px] text-[13px] font-bold tracking-wide data-[state=active]:bg-[#283618] data-[state=active]:text-white"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Discussion
                </TabsTrigger>
                <TabsTrigger
                  value="overview"
                  className="rounded-[12px] text-[13px] font-bold tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[#ece5c8]"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Overview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0 space-y-4 sm:space-y-5 focus-visible:outline-none focus-visible:ring-0">
              <SectionCard
                title="Question"
                description={`Created ${formatDetailedDate(doubt.createdAt)}`}
              >
                <RichText content={doubt.description} />
                <AttachmentGallery
                  attachments={doubt.attachmentUrls ?? []}
                  onImageOpen={setSelectedImage}
                />
              </SectionCard>

              {hasVerifiedAnswer ? (
                <div className="rounded-[24px] bg-[#f6fbf2] p-5 ring-1 ring-[#d9ead0] shadow-sm relative overflow-hidden transition-all">
                  <div className="absolute -left-[1px] top-5 bottom-5 w-1 rounded-r-full bg-[#2d8c53]" />
                  <div
                    className={cn("flex items-center justify-between cursor-pointer select-none", showVerified ? "mb-3" : "")}
                    onClick={() => setShowVerified((prev) => !prev)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-[#2d8c53] shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#2d8c53]">
                          Verified Answer
                        </p>
                        <p className="text-[10px] font-medium text-[#5f615a]">
                          Teacher approved on {doubt.verifiedAt ? formatDetailedDate(doubt.verifiedAt) : formatDetailedDate(doubt.updatedAt || doubt.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-[#5f615a] hover:text-[#212121] hover:bg-[#d9ead0]/40 -mr-1"
                      asChild={false}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showVerified && "rotate-180")} />
                    </Button>
                  </div>
                  {showVerified && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-[18px] bg-white/80 p-4">
                      <RichText content={doubt.verifiedAnswer} className="text-[#212121]" />
                    </div>
                  )}
                </div>
              ) : hasAiDraft ? (
                <div className="rounded-[24px] bg-[#fdfcfa] p-5 ring-1 ring-[#ece5c8]/60 shadow-sm relative overflow-hidden transition-all">
                  <div className="absolute -left-[1px] top-5 bottom-5 w-1 rounded-r-full bg-[#c4a57b]" />
                  <div
                    className={cn("flex items-center justify-between cursor-pointer select-none", showAiDraft ? "mb-3" : "")}
                    onClick={() => setShowAiDraft((prev) => !prev)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c4a57b]/10 text-[#c4a57b]">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#a3a3a3]">
                          AI Draft
                        </p>
                        <p className="text-[10px] font-medium text-[#737373]">
                          Unverified preliminary answer
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-[#a3a3a3] hover:text-[#414141] hover:bg-[#ece5c8]/40 -mr-1"
                      asChild={false}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showAiDraft && "rotate-180")} />
                    </Button>
                  </div>
                  {showAiDraft && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <RichText content={doubt.aiDraftAnswer} className="text-[#414141] font-medium" />
                    </div>
                  )}
                </div>
              ) : (
                <SectionCard title="Answer">
                  <div className="rounded-[24px] bg-[#eef7fd] p-5 ring-1 ring-[#cfe6f5]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#356985]">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#212121]">Awaiting teacher review</p>
                        <p className="mt-1 text-sm font-medium leading-6 text-[#356985]">
                          No answer has been published yet. Once a teacher verifies the doubt, the
                          answer will appear here.
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {canRateAndResolve ? (
                <SectionCard
                  title="Resolve"
                  description="Rate the answer once you are satisfied and the doubt will be closed."
                >
                  <ResolveCard
                    submitting={rateDoubtMutation.isPending}
                    existingRating={doubt.studentRating}
                    existingFeedback={doubt.studentFeedback}
                    onSubmit={handleResolve}
                  />
                </SectionCard>
              ) : null}

              {similarDoubtsQuery.data && similarDoubtsQuery.data.length > 0 ? (
                <SectionCard
                  title="Similar Doubts"
                  description="The mobile flow surfaces nearby solved doubts so students can learn faster."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {similarDoubtsQuery.data.map((item) => (
                      <SimilarDoubtCard key={item.id} doubt={item} />
                    ))}
                  </div>
                </SectionCard>
              ) : null}
            </TabsContent>

            <TabsContent value="discussion" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <SectionCard
                title="Thread"
                description={
                  isOwner
                    ? "This thread updates as your teacher or the AI assistant responds."
                    : "Public viewers can read the doubt, but discussion stays with the student who created it."
                }
              >
                {isOwner ? (
                  messagesQuery.isError ? (
                    <div className="rounded-[20px] border border-[#f2d5d1] bg-[#fff5f3] p-4 text-sm font-medium text-[#bf4d42]">
                      {messagesQuery.error instanceof Error
                        ? messagesQuery.error.message
                        : "Messages could not be loaded."}
                    </div>
                  ) : visibleMessages.length > 0 ? (
                    <div className="space-y-3 pb-8">
                      {visibleMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          onImageOpen={setSelectedImage}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-[#faf8ef] px-5 py-8 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#283618] ring-1 ring-[#ece5c8]">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-base font-bold text-[#212121]">No discussion yet</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-[#737373]">
                        Once the doubt starts moving, teacher and AI responses will appear here.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="rounded-[20px] bg-[#faf8ef] p-5 ring-1 ring-[#ece5c8]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#737373] ring-1 ring-[#ece5c8]">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#212121]">Chat disabled for this view</p>
                        <p className="mt-1 text-sm font-medium leading-6 text-[#737373]">
                          {chatDisabledReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        {canChat ? (
          <div className="fixed bottom-[84px] left-0 right-0 z-40 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[460px] sm:px-0">
            <div className="relative w-full shadow-lg rounded-full">
              <Input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Message your teacher..."
                className="h-[52px] rounded-full border-2 border-[#ece5c8] bg-white px-5 pr-14 text-base font-medium text-[#212121] outline-none placeholder:text-[#a3a3a3] focus-visible:ring-[#cadab2] focus-visible:border-[#cadab2]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={!messageDraft.trim() || addMessageMutation.isPending}
                className="absolute right-1.5 top-1.5 bottom-1.5 h-auto w-[40px] shrink-0 rounded-full p-0 shadow-none transition-transform active:scale-95 bg-[#283618] hover:bg-[#283618]/90"
              >
                {addMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#cadab2]" />
                ) : (
                  <Send className="h-4 w-4 ml-0.5 text-white" />
                )}
              </Button>
            </div>
          </div>
        ) : null}

      </main>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <div className="relative overflow-hidden rounded-[24px] bg-black">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
            {selectedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImage}
                alt="Selected attachment"
                className="max-h-[80vh] w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
