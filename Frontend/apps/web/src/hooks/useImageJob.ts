"use client";

import { useQuery } from "@tanstack/react-query";
import type { SignedRequestContext } from "@/lib/api.js";
import { api } from "@/lib/api.js";

export const useImageJob = (
  jobId: string | null,
  signed?: SignedRequestContext
) => {
  return useQuery({
    queryKey: ["image-job", jobId],
    enabled: Boolean(jobId && signed),
    queryFn: async () => {
      if (!jobId || !signed) throw new Error("Job not available");
      return api.getImageJob(jobId, signed);
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      return data.status === "completed" || data.status === "failed"
        ? false
        : 2500;
    },
  });
};
