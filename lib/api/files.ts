import { isAxiosError } from "axios";

import { apiClient } from "@/lib/api/config";

interface UploadFileEnvelope {
  success?: boolean;
  message?: string;
  error?: string;
  file?: UploadedFile;
}

export interface UploadedFile {
  id?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  fileUrl?: string;
  downloadUrl?: string;
}

export interface UploadFilePayload {
  file: File;
  description?: string;
  tags?: string[];
  onUploadProgress?: (progress: number) => void;
}

export class FilesApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "FilesApiError";
    this.status = status;
  }
}

function toFilesApiError(error: unknown): FilesApiError {
  if (error instanceof FilesApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const responseBody = (error.response?.data ?? {}) as UploadFileEnvelope;
    return new FilesApiError(
      responseBody.error || responseBody.message || error.message || "File upload failed.",
      error.response?.status ?? null,
    );
  }

  if (error instanceof Error) {
    return new FilesApiError(error.message);
  }

  return new FilesApiError("File upload failed.");
}

export async function uploadFileToS3({
  file,
  description,
  tags,
  onUploadProgress,
}: UploadFilePayload): Promise<UploadedFile> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (description) {
      formData.append("description", description);
    }

    if (tags && tags.length > 0) {
      formData.append("tags", tags.join(","));
    }

    const response = await apiClient.post<UploadFileEnvelope>("/files3/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) {
          return;
        }

        onUploadProgress(Math.round((event.loaded * 100) / event.total));
      },
    });

    if (!response.data.file) {
      throw new FilesApiError("Uploaded file data was not returned.");
    }

    return response.data.file;
  } catch (error) {
    throw toFilesApiError(error);
  }
}

export { toFilesApiError };
