"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, getJobs, isAbortError } from "@/lib/api";
import { JOB_POLL_INTERVAL_MS } from "@/lib/constants";
import type { Job } from "@/lib/types";

interface UseJobFeedOptions {
  userId: string;
  templateId?: string;
  limit?: number;
}

interface UseJobFeedResult {
  jobs: Job[];
  loading: boolean;
  initialError: string | null;
  queryError: string | null;
  isRefreshing: boolean;
  addJob: (job: Job) => void;
  refresh: () => Promise<void>;
  retryInitial: () => Promise<void>;
}

type LoadMode = "initial" | "poll" | "manual";

export function isActiveJob(job: Job): boolean {
  return job.status === "QUEUED" || job.status === "PROCESSING";
}

export function useJobFeed({
  userId,
  templateId,
  limit = 50,
}: UseJobFeedOptions): UseJobFeedResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [initialError, setInitialError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const jobsRef = useRef<Job[]>([]);
  const requestSeq = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchJobs = useCallback(
    async (mode: LoadMode) => {
      if (!userId) return;

      requestSeq.current += 1;
      const sequence = requestSeq.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (mode === "initial") {
        setLoading(true);
        setInitialError(null);
      }
      if (mode === "manual") {
        setIsRefreshing(true);
      }

      try {
        const data = await getJobs(userId, {
          templateId,
          limit,
          signal: controller.signal,
        });
        if (sequence !== requestSeq.current) return;
        jobsRef.current = data;
        setJobs(data);
        setInitialError(null);
        setQueryError(null);
      } catch (error) {
        if (sequence !== requestSeq.current || isAbortError(error)) return;
        const message = errorMessage(error);
        if (mode === "initial" && jobsRef.current.length === 0) {
          setInitialError(message);
        } else {
          // A failed status query is not a failed job. Keep the last known
          // job snapshot and expose a recoverable transport error.
          setQueryError(message);
        }
      } finally {
        if (sequence === requestSeq.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [userId, templateId, limit],
  );

  useEffect(() => {
    jobsRef.current = [];
    setJobs([]);
    setInitialError(null);
    setQueryError(null);
    setIsRefreshing(false);

    if (!userId) {
      setLoading(false);
      return;
    }

    void fetchJobs("initial");

    return () => {
      requestSeq.current += 1;
      controllerRef.current?.abort();
    };
  }, [userId, fetchJobs]);

  const hasActiveJobs = jobs.some(isActiveJob);

  useEffect(() => {
    if (!userId || loading || !hasActiveJobs) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (delay: number) => {
      if (cancelled) return;
      timer = setTimeout(run, delay);
    };

    const run = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        schedule(4000);
        return;
      }
      await fetchJobs("poll");
      if (!cancelled) {
        schedule(JOB_POLL_INTERVAL_MS);
      }
    };

    schedule(JOB_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasActiveJobs, loading, userId, fetchJobs]);

  const addJob = useCallback((job: Job) => {
    // Invalidate any list request that was issued before this new job was
    // accepted. Otherwise an older response could overwrite the fresh job.
    requestSeq.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setLoading(false);
    setIsRefreshing(false);
    setInitialError(null);
    setJobs((previous) => {
      const next = [job, ...previous.filter((item) => item.id !== job.id)];
      jobsRef.current = next;
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchJobs(jobsRef.current.length > 0 ? "manual" : "initial");
  }, [fetchJobs]);

  const retryInitial = useCallback(async () => {
    await fetchJobs("initial");
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    initialError,
    queryError,
    isRefreshing,
    addJob,
    refresh,
    retryInitial,
  };
}
