"use client";

import { useMutation } from "@tanstack/react-query";

import {
  uploadFileToS3,
  type UploadFilePayload,
} from "@/lib/api/files";

export function useFileUploadMutation() {
  return useMutation({
    mutationFn: (payload: UploadFilePayload) => uploadFileToS3(payload),
  });
}
