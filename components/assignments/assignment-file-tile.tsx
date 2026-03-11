import { Download, File, FileText, Image as ImageIcon, Loader2, PlayCircle, Video, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type AssignmentPreviewFileType = "image" | "audio" | "video" | "document";

function renderFileIcon(type: AssignmentPreviewFileType) {
  switch (type) {
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "audio":
      return <Volume2 className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
    case "document":
    default:
      return <FileText className="h-5 w-5" />;
  }
}

export function getPreviewFileType(url: string, declaredType?: string): AssignmentPreviewFileType {
  const normalizedType = (declaredType ?? "").toLowerCase();
  const normalizedUrl = (url.split("?")[0] || "").toLowerCase();

  if (normalizedType.includes("image") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(normalizedUrl)) {
    return "image";
  }

  if (normalizedType.includes("audio") || normalizedType === "voice_note" || /\.(mp3|wav|ogg|aac|m4a|webm)$/.test(normalizedUrl)) {
    return "audio";
  }

  if (normalizedType.includes("video") || /\.(mp4|mov|avi|mkv)$/.test(normalizedUrl)) {
    return "video";
  }

  return "document";
}

export function getReadableFileName(url: string, fallback = "Attachment") {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").pop();
    return filename ? decodeURIComponent(filename) : fallback;
  } catch {
    const filename = url.split("?")[0].split("/").pop();
    return filename ? decodeURIComponent(filename) : fallback;
  }
}

export function AssignmentFileTile({
  title,
  subtitle,
  type,
  loading = false,
  tone = "default",
  onClick,
}: {
  title: string;
  subtitle?: string;
  type: AssignmentPreviewFileType;
  loading?: boolean;
  tone?: "default" | "answer-key" | "graded" | "uploaded";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70",
        tone === "answer-key"
          ? "border-[#d9ead0] bg-[#f6fbf2] hover:border-[#b6d7a8]"
          : tone === "graded"
            ? "border-[#cfe6f5] bg-[#eef7fd] hover:border-[#a6d0ea]"
            : tone === "uploaded"
              ? "border-[#d9ead0] bg-[#f6fbf2]"
              : "border-[#ece5c8] bg-white hover:border-[#cadab2] hover:bg-[#fcfbf5]",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]",
          tone === "answer-key"
            ? "bg-white text-[#2d8c53]"
            : tone === "graded"
              ? "bg-white text-[#356985]"
              : tone === "uploaded"
                ? "bg-white text-[#2d8c53]"
                : "bg-[#faf8ef] text-[#283618]",
        )}
      >
        {type === "audio" ? (
          <PlayCircle className="h-5 w-5" />
        ) : type === "video" ? (
          <Video className="h-5 w-5" />
        ) : type === "image" ? (
          <ImageIcon className="h-5 w-5" />
        ) : (
          renderFileIcon(type)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#212121]">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs font-medium text-[#737373]">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#737373] ring-1 ring-black/5">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </div>
    </button>
  );
}

export function SimpleFilePill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#d9ead0] bg-[#f6fbf2] px-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[#2d8c53]">
        <File className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#212121]">{label}</p>
        <p className="mt-0.5 text-xs font-medium text-[#737373]">Ready to upload</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5f3] text-[#bf4d42] transition-colors hover:bg-[#fee9e5]"
        aria-label="Remove selected file"
      >
        <span className="text-sm font-semibold leading-none">X</span>
      </button>
    </div>
  );
}
