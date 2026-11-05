"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState, QueryErrorBanner } from "@/components/feedback";
import { AlertCircleIcon, RefreshIcon } from "@/components/icons";
import { JobCard } from "@/components/job-card";
import { ResultDialog } from "@/components/result-dialog";
import type { Job } from "@/lib/types";

interface JobBoardProps {
  jobs: Job[];
  loading: boolean;
  initialError: string | null;
  queryError: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRetryInitial: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  layout?: "compact" | "wide";
  skeletonCount?: number;
}

export function JobSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="job-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="job-card skeleton-card" key={index}>
          <div className="skeleton skeleton-media" />
          <div className="job-card-body">
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobBoard({
  jobs,
  loading,
  initialError,
  queryError,
  isRefreshing,
  onRefresh,
  onRetryInitial,
  emptyTitle = "还没有制作记录",
  emptyDescription = "选一个模板，上传图片，创建你的第一个任务。",
  layout = "compact",
  skeletonCount = 3,
}: JobBoardProps) {
  const [previewJob, setPreviewJob] = useState<Job | null>(null);

  if (loading) {
    return <JobSkeletonGrid count={skeletonCount} />;
  }

  if (initialError) {
    return (
      <div className="board-error" role="alert">
        <span className="board-error-icon"><AlertCircleIcon /></span>
        <h3>制作记录加载失败</h3>
        <p>{initialError}</p>
        <button type="button" className="button secondary small" onClick={onRetryInitial}>
          <RefreshIcon />
          重新加载
        </button>
      </div>
    );
  }

  return (
    <>
      {queryError && (
        <QueryErrorBanner message={queryError} onRetry={onRefresh} retrying={isRefreshing} />
      )}

      {jobs.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Link className="button secondary small" href="/">
              浏览模板
            </Link>
          }
        />
      ) : (
        <div className={`job-grid job-grid-${layout}`}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onPreview={setPreviewJob} />
          ))}
        </div>
      )}

      <ResultDialog job={previewJob} onClose={() => setPreviewJob(null)} />
    </>
  );
}
