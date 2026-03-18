"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Loader2,
  LogOut,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Send,
  Volume2,
} from "lucide-react";

import {
  AssignmentFileTile,
  SimpleFilePill,
  getPreviewFileType,
  getReadableFileName,
  type AssignmentPreviewFileType,
} from "@/components/assignments/assignment-file-tile";
import { AssignmentStatusBadge } from "@/components/assignments/assignment-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAssignmentDetailQuery, useCancelAssignmentSubmissionMutation, useSubmitAssignmentMutation } from "@/hooks/use-assignments";
import { useFileUploadMutation } from "@/hooks/use-files";
import { useAuthProfileQuery, useLogoutMutation } from "@/hooks/use-auth";
import { refreshAssignmentUrl } from "@/lib/api/assignments";
import { clearSession, getStoredToken } from "@/lib/auth/storage";

type PreviewState = {
  url: string;
  title: string;
  type: AssignmentPreviewFileType;
};

function formatDetailedDate(date?: string | null) {
  if (!date) return "No date available";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getTimingLabel(
  status: string,
  daysRemaining: number,
  daysOverdue: number,
  dueDate?: string | null,
) {
  if (!dueDate) {
    return "No due date";
  }

  if (status === "overdue") {
    if (daysOverdue === 0) return "Past due";
    if (daysOverdue === 1) return "1 day overdue";
    return `${daysOverdue} days overdue`;
  }

  if (status === "pending") {
    if (daysRemaining === 0) return "Due today";
    if (daysRemaining === 1) return "Due tomorrow";
    return `${daysRemaining} days remaining`;
  }

  return `Due ${formatDetailedDate(dueDate)}`;
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
    <section className="rounded-[24px] border border-[#ece5c8] bg-white p-4 shadow-sm sm:p-5">
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

function PreviewDialog({
  preview,
  open,
  onOpenChange,
}: {
  preview: PreviewState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-[24px] border-[#ece5c8] p-5 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-bold text-[#212121]">
            {preview?.title ?? "Preview"}
          </DialogTitle>
          <DialogDescription>
            Review the assignment resource without leaving the portal.
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="space-y-4">
            {preview.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.title}
                className="max-h-[70vh] w-full rounded-[20px] object-contain"
              />
            ) : preview.type === "audio" ? (
              <div className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-5">
                <audio controls className="w-full">
                  <source src={preview.url} />
                </audio>
              </div>
            ) : preview.type === "video" ? (
              <video controls className="max-h-[70vh] w-full rounded-[20px] bg-black">
                <source src={preview.url} />
              </video>
            ) : (
              <div className="overflow-hidden rounded-[20px] border border-[#ece5c8]">
                <iframe
                  title={preview.title}
                  src={preview.url}
                  className="h-[70vh] w-full bg-white"
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" asChild>
                <a href={preview.url} target="_blank" rel="noreferrer">
                  Open in new tab
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailLoadingState() {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] pb-28">
      <section className="h-48 animate-pulse rounded-b-[32px] bg-[#283618] sm:h-56" />
      <div className="mx-auto -mt-6 max-w-5xl px-3 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-40 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
          <div className="h-52 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
          <div className="h-72 rounded-[24px] border border-[#ece5c8] bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#f0f2f5] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-[28px] border border-[#ece5c8] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#fff5f3] text-[#bf4d42] ring-1 ring-[#f2d5d1]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="mt-4 text-lg font-bold text-[#212121]">Assignment unavailable</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#737373]">{message}</p>
        <Button className="mt-5" asChild>
          <Link href="/assignments">Back to assignments</Link>
        </Button>
      </div>
    </main>
  );
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = Array.isArray(params.assignmentId)
    ? params.assignmentId[0]
    : params.assignmentId;
  const token = getStoredToken();
  const profileQuery = useAuthProfileQuery();
  const logoutMutation = useLogoutMutation();

  const [note, setNote] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [openingUrl, setOpeningUrl] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewState | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const detailQuery = useAssignmentDetailQuery(assignmentId);
  const uploadFileMutation = useFileUploadMutation();
  const submitAssignmentMutation = useSubmitAssignmentMutation(assignmentId);
  const cancelSubmissionMutation = useCancelAssignmentSubmissionMutation(assignmentId);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace("/login");
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const isValidType =
      file.type === "application/pdf" || file.type.startsWith("image/");

    if (!isValidType) {
      setFileError("Only PDF and image files are allowed.");
      return;
    }

    setSelectedFile(file);
    setFileError(null);
  };

  const openPreview = async (url: string, title: string, declaredType?: string) => {
    setOpeningUrl(url);

    try {
      const refreshedUrl = await refreshAssignmentUrl(url);
      setPreview({
        url: refreshedUrl,
        title,
        type: getPreviewFileType(refreshedUrl, declaredType),
      });
    } catch {
      return;
    } finally {
      setOpeningUrl(null);
    }
  };

  const handleSubmit = async () => {
    const trimmedNote = note.trim();

    if (!selectedFile && !trimmedNote) {
      setFileError("Attach a file or add a private note before turning in your work.");
      return;
    }

    try {
      let fileUrls: string[] = [];

      if (selectedFile) {
        const uploadedFile = await uploadFileMutation.mutateAsync({
          file: selectedFile,
          onUploadProgress: (progress) => {
            setUploadProgress(progress);
          },
        });

        if (!uploadedFile.downloadUrl) {
          throw new Error("The selected file could not be uploaded.");
        }

        fileUrls = [uploadedFile.downloadUrl];
      }

      await submitAssignmentMutation.mutateAsync({
        content: trimmedNote || undefined,
        fileUrls,
      });

      setSelectedFile(null);
      setNote("");
      setFileError(null);
      setUploadProgress(null);
    } catch (error) {
      setUploadProgress(null);
      setFileError(
        error instanceof Error ? error.message : "The assignment could not be submitted.",
      );
    }
  };

  const handleCancelSubmission = async () => {
    const confirmed = window.confirm(
      "Cancel your submission and reopen the assignment for resubmission?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await cancelSubmissionMutation.mutateAsync();
      setSelectedFile(null);
      setNote("");
      setFileError(null);
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

  if (detailQuery.isError || !detailQuery.data) {
    const message =
      detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "We could not load this assignment.";

    return <ErrorState message={message} />;
  }

  const { assignment, submission, status, daysRemaining, daysOverdue, canSubmit, canResubmit } =
    detailQuery.data;
  const isMaterial = ["material", "presentation", "lab_work", "other"].includes(assignment.type);
  const isTeacherManaged = assignment.submissionMode === "teacher";
  const displayStatus = isMaterial ? "material" : status;
  const scorePercentage =
    submission?.marks != null && assignment.totalMarks > 0
      ? Math.round((submission.marks / assignment.totalMarks) * 100)
      : null;
  const canTurnIn = canSubmit && !submission && !isMaterial && !isTeacherManaged;
  const voiceInstructionUrl =
    assignment.voiceInstructionUrl ?? assignment.voiceInstructions?.[0]?.url ?? null;
  const voiceFeedbackUrl =
    submission?.voiceFeedbackUrl ?? submission?.voiceFeedbacks?.[0]?.url ?? null;

  return (
    <>
      <main className="min-h-[100dvh] bg-[#f0f2f5] pb-28 sm:pb-10">
        <section className="rounded-b-[32px] bg-[#283618] px-3 pb-8 pt-4 shadow-sm sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#283618] ring-2 ring-white/10">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                    Assignment Detail
                  </p>
                  <p className="text-xl font-extrabold tracking-tight text-white">
                    CJ Coaching
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/assignments"
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void detailQuery.refetch()}
                  className="h-10 rounded-[12px] border-0 bg-white/10 px-3 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="h-10 rounded-[12px] border-0 bg-white/10 px-3 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                  </span>
                </Button>
              </div>
            </div>

            <div className="mt-7 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <AssignmentStatusBadge status={displayStatus} />
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/20">
                  {getTimingLabel(status, daysRemaining, daysOverdue, assignment.dueDate)}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {assignment.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 font-semibold text-[#cadab2]">
                  <BookOpen className="h-3.5 w-3.5" />
                  {assignment.subject}
                </span>
                {assignment.totalMarks > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white ring-1 ring-white/20">
                    {assignment.totalMarks} points
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white ring-1 ring-white/20">
                  {assignment.dueDate
                    ? `Due ${formatDetailedDate(assignment.dueDate)}`
                    : assignment.createdAt
                      ? `Shared ${formatDetailedDate(assignment.createdAt)}`
                      : "Shared resource"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto -mt-6 max-w-5xl px-3 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <SectionCard
              title="Overview"
              description={
                assignment.teacher?.name
                  ? `Shared by ${assignment.teacher.name}`
                  : "Assignment details from your class."
              }
            >
              <div className="space-y-4">
                {assignment.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#4f514b]">
                    {assignment.description}
                  </p>
                ) : null}

                {assignment.instructions ? (
                  <div className="rounded-[18px] bg-[#faf8ef] p-4 ring-1 ring-[#ece5c8]">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#737373]">
                      Instructions
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4f514b]">
                      {assignment.instructions}
                    </p>
                  </div>
                ) : null}
              </div>
            </SectionCard>

            {assignment.attachments && assignment.attachments.length > 0 ? (
              <SectionCard
                title="Resources"
                description="Files attached by your teacher for this assignment."
              >
                <div className="space-y-3">
                  {assignment.attachments.map((attachment, index) => (
                    <AssignmentFileTile
                      key={`${attachment.url}-${index}`}
                      title={attachment.name || getReadableFileName(attachment.url, `Attachment ${index + 1}`)}
                      subtitle="Tap to preview"
                      type={getPreviewFileType(attachment.url, attachment.type)}
                      loading={openingUrl === attachment.url}
                      onClick={() =>
                        void openPreview(
                          attachment.url,
                          attachment.name || getReadableFileName(attachment.url, `Attachment ${index + 1}`),
                          attachment.type,
                        )
                      }
                    />
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {voiceInstructionUrl ? (
              <SectionCard
                title="Voice Instructions"
                description="Listen to the teacher's spoken guidance for this assignment."
              >
                <div className="rounded-[20px] border border-[#ece5c8] bg-[#faf8ef] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#283618] ring-1 ring-[#ece5c8]">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#212121]">Voice instructions</p>
                      <p className="text-xs font-medium text-[#737373]">
                        Listen before you start your submission.
                      </p>
                    </div>
                  </div>
                  <audio controls className="w-full">
                    <source src={voiceInstructionUrl} />
                  </audio>
                </div>
              </SectionCard>
            ) : null}

            {(assignment.answerKey && assignment.answerKey.length > 0) || assignment.answerKeyUrl ? (
              <SectionCard
                title="Answer Key"
                description="Visible because your teacher allowed the answer key for this assignment."
              >
                <div className="space-y-3">
                  {assignment.answerKey?.map((item, index) => (
                    <AssignmentFileTile
                      key={`${item.url}-${index}`}
                      title={item.name || `Answer key ${index + 1}`}
                      subtitle="Tap to preview"
                      type={getPreviewFileType(item.url, item.type)}
                      loading={openingUrl === item.url}
                      tone="answer-key"
                      onClick={() =>
                        void openPreview(
                          item.url,
                          item.name || `Answer key ${index + 1}`,
                          item.type,
                        )
                      }
                    />
                  ))}

                  {assignment.answerKeyUrl && !assignment.answerKey?.length ? (
                    <AssignmentFileTile
                      title="Answer key"
                      subtitle="Tap to preview"
                      type={getPreviewFileType(assignment.answerKeyUrl)}
                      loading={openingUrl === assignment.answerKeyUrl}
                      tone="answer-key"
                      onClick={() =>
                        void openPreview(assignment.answerKeyUrl!, "Answer key")
                      }
                    />
                  ) : null}
                </div>
              </SectionCard>
            ) : null}

            {submission?.annotatedSheetUrls && submission.annotatedSheetUrls.length > 0 ? (
              <SectionCard
                title="Graded Submission"
                description="Teacher-marked sheets are available after grading."
              >
                <div className="space-y-3">
                  {submission.annotatedSheetUrls.map((url, index) => (
                    <AssignmentFileTile
                      key={`${url}-${index}`}
                      title={index === 0 ? "Annotated submission" : `Annotated sheet ${index + 1}`}
                      subtitle="Tap to preview"
                      type={getPreviewFileType(url)}
                      loading={openingUrl === url}
                      tone="graded"
                      onClick={() =>
                        void openPreview(
                          url,
                          index === 0 ? "Annotated submission" : `Annotated sheet ${index + 1}`,
                        )
                      }
                    />
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {!isMaterial ? (
              <SectionCard
                title="Your Work"
                description="Track what you submitted, teacher feedback, and any resubmission status."
              >
                <div className="rounded-[20px] border border-[#ece5c8] bg-[#fcfbf5] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-[#ece5c8]/70 pb-4">
                    <div>
                      <p className="text-base font-bold text-[#212121]">Your work</p>
                      <p className="mt-1 text-sm font-medium text-[#737373]">
                        {submission?.submittedAt
                          ? `Submitted ${formatDetailedDate(submission.submittedAt)}`
                          : isTeacherManaged
                            ? "Teacher-managed submission"
                            : "Not submitted yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission?.marks != null ? (
                        <span className="text-sm font-bold text-[#212121]">
                          {submission.marks}/{assignment.totalMarks}
                        </span>
                      ) : null}
                      <AssignmentStatusBadge status={displayStatus} size="sm" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {submission ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          {submission.revisionNumber && submission.revisionNumber > 1 ? (
                            <span className="inline-flex items-center rounded-full bg-[#eef7fd] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#356985] ring-1 ring-[#cfe6f5]">
                              Revision {submission.revisionNumber}
                            </span>
                          ) : null}
                          {submission.isLate ? (
                            <span className="inline-flex items-center rounded-full bg-[#fff5f3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#bf4d42] ring-1 ring-[#f2d5d1]">
                              Late
                            </span>
                          ) : null}
                        </div>

                        {canResubmit ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-[#e8c37a] bg-[#fffaf0] text-[#a36500] hover:bg-[#fff5dc] hover:text-[#8a6914]"
                            onClick={() => void handleCancelSubmission()}
                            disabled={cancelSubmissionMutation.isPending}
                          >
                            {cancelSubmissionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            {cancelSubmissionMutation.isPending ? "Cancelling..." : "Cancel & resubmit"}
                          </Button>
                        ) : null}

                        {scorePercentage != null ? (
                          <div className="rounded-[20px] border border-[#d9ead0] bg-[#f6fbf2] p-5 text-center">
                            <p className="text-sm font-medium text-[#2d8c53]">Your score</p>
                            <p className="mt-2 text-4xl font-extrabold tracking-tight text-[#2d8c53]">
                              {scorePercentage}%
                            </p>
                            <p className="mt-2 text-sm font-medium text-[#4f514b]">
                              {submission?.marks} out of {assignment.totalMarks} marks
                            </p>
                          </div>
                        ) : null}

                        {submission.feedback ? (
                          <div className="rounded-[20px] border border-[#ece5c8] bg-[#fffaf0] p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#737373]">
                              Private comments
                            </p>
                            <div className="mt-3 flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ece6c8] text-sm font-bold text-[#414141]">
                                {assignment.teacher?.name?.charAt(0).toUpperCase() ?? "T"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#212121]">
                                  {assignment.teacher?.name ?? "Teacher"}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#7b5e1b]">
                                  {submission.feedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {voiceFeedbackUrl ? (
                          <div className="rounded-[20px] border border-[#eadcfb] bg-[#faf5ff] p-4">
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8b5cf6] ring-1 ring-[#eadcfb]">
                                <Volume2 className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#212121]">Voice feedback</p>
                                <p className="text-xs font-medium text-[#737373]">
                                  Listen to the teacher&apos;s feedback.
                                </p>
                              </div>
                            </div>
                            <audio controls className="w-full">
                              <source src={voiceFeedbackUrl} />
                            </audio>
                          </div>
                        ) : null}

                        {(submission.content ||
                          submission.fileUrls?.length ||
                          submission.voiceNoteUrl) ? (
                          <div className="space-y-3 border-t border-[#ece5c8]/70 pt-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#737373]">
                              Submission
                            </p>

                            {submission.content ? (
                              <div className="rounded-[18px] bg-white p-4 ring-1 ring-[#ece5c8]">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-[#4f514b]">
                                  {submission.content}
                                </p>
                              </div>
                            ) : null}

                            {submission.voiceNoteUrl ? (
                              <AssignmentFileTile
                                title="Submitted voice note"
                                subtitle="Tap to preview"
                                type={getPreviewFileType(submission.voiceNoteUrl)}
                                loading={openingUrl === submission.voiceNoteUrl}
                                tone="uploaded"
                                onClick={() =>
                                  void openPreview(
                                    submission.voiceNoteUrl!,
                                    "Submitted voice note",
                                  )
                                }
                              />
                            ) : null}

                            {submission.fileUrls?.map((url, index) => (
                              <AssignmentFileTile
                                key={`${url}-${index}`}
                                title={getReadableFileName(url, `Submission ${index + 1}`)}
                                subtitle="Tap to preview"
                                type={getPreviewFileType(url)}
                                loading={openingUrl === url}
                                tone="uploaded"
                                onClick={() =>
                                  void openPreview(
                                    url,
                                    getReadableFileName(url, `Submission ${index + 1}`),
                                  )
                                }
                              />
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : isTeacherManaged ? (
                      <div className="rounded-[20px] border border-[#cfe6f5] bg-[#eef7fd] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#356985] ring-1 ring-[#cfe6f5]">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#212121]">
                              Teacher will upload your work
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#356985]">
                              This assignment is managed by your teacher. Your answer sheet and
                              grade will appear here once it is reviewed.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : canTurnIn ? (
                      <>
                        {selectedFile ? (
                          <SimpleFilePill
                            label={selectedFile.name}
                            onRemove={() => {
                              setSelectedFile(null);
                              setFileError(null);
                            }}
                          />
                        ) : (
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={handleFileSelection}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <FileText className="h-4 w-4" />
                              Add work
                            </Button>
                          </div>
                        )}

                        {fileError ? (
                          <div className="rounded-[18px] border border-[#f2d5d1] bg-[#fff5f3] p-4 text-sm font-medium text-[#bf4d42]">
                            {fileError}
                          </div>
                        ) : null}

                        <Textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Add a private comment..."
                          className="min-h-[120px]"
                        />

                        {uploadProgress != null ? (
                          <div className="rounded-[18px] border border-[#d9ead0] bg-[#f6fbf2] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-[#2d8c53]">
                                Uploading your file...
                              </p>
                              <p className="text-sm font-bold text-[#2d8c53]">
                                {uploadProgress}%
                              </p>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-[#e5f2df]">
                              <div
                                className="h-2 rounded-full bg-[#2d8c53] transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[#ece5c8] bg-white p-5 text-center text-sm font-medium text-[#737373]">
                        Submission is not available for this assignment.
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>
        </div>
      </main>

      {canTurnIn ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece5c8] bg-white/95 px-4 pb-5 pt-4 backdrop-blur-lg sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] sm:rounded-[24px] sm:border sm:p-4 sm:shadow-xl">
          <Button
            type="button"
            className="h-12 w-full text-base font-semibold"
            onClick={() => void handleSubmit()}
            disabled={submitAssignmentMutation.isPending || uploadFileMutation.isPending}
          >
            {submitAssignmentMutation.isPending || uploadFileMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {submitAssignmentMutation.isPending || uploadFileMutation.isPending
              ? "Submitting..."
              : "Turn in"}
          </Button>
        </div>
      ) : null}

      <PreviewDialog
        preview={preview}
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
          }
        }}
      />
    </>
  );
}
