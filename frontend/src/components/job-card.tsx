"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircleIcon, ArrowUpRightIcon } from "@/components/icons";
import { StatusPill } from "@/components/status-pill";
import { formatFullDate, formatRelativeTime } from "@/lib/format";
import { PIPELINE_STEPS, pipelineStates, stageSummary } from "@/lib/job-meta";
import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  onPreview: (job: Job) => void;
}

export function JobCard({ job, onPreview }: JobCardProps) {
  const isSuccess = job.status === "SUCCEEDED" && Boolean(job.resultUrl);
  const isFailed = job.status === "FAILED";
  const isActive = job.status === "QUEUED" || job.status === "PROCESSING";
  const steps = pipelineStates(job);
  const imageUrl = isSuccess ? job.resultUrl! : job.templateCoverUrl;

  return (
    <article className={`job-card job-card-${job.status.toLowerCase()}`}>
      <div className="job-media">
        <Image
          src={imageUrl}
          alt={isSuccess ? `「${job.templateTitle}」的制作成品` : `「${job.templateTitle}」模板预览`}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 260px"
          className="job-media-image"
        />
        <div className="job-media-shade" aria-hidden="true" />
        <div className="job-card-top">
          <StatusPill status={job.status} />
        </div>

        {isActive && (
          <div className="job-media-state" aria-hidden="true">
            <span className="orbit-loader">
              <span />
            </span>
            <span>{stageSummary(job)}</span>
          </div>
        )}

        {isFailed && (
          <div className="job-media-state job-media-failed" aria-hidden="true">
            <AlertCircleIcon />
            <span>{stageSummary(job)}</span>
          </div>
        )}

        {isSuccess && (
          <button
            type="button"
            className="job-preview-hit"
            onClick={() => onPreview(job)}
            aria-label={`预览「${job.templateTitle}」的成品`}
          >
            <span className="job-preview-label">
              查看成品
              <ArrowUpRightIcon />
            </span>
          </button>
        )}
      </div>

      <div className="job-card-body">
        <div className="job-card-heading">
          <div>
            <Link className="job-card-title" href={`/templates/${job.templateId}`}>
              {job.templateTitle}
            </Link>
            <p className="job-card-meta">
              <time dateTime={job.createdAt} title={formatFullDate(job.createdAt)}>
                {formatRelativeTime(job.createdAt)}
              </time>
              <span aria-hidden="true">·</span>
              {job.assetCount} 张素材
            </p>
          </div>
          <span className="job-progress-label">{job.progress}%</span>
        </div>

        <div className="mini-progress" aria-hidden="true">
          <span style={{ width: `${job.progress}%` }} />
        </div>

        <ol className="mini-pipeline" aria-label="制作步骤">
          {PIPELINE_STEPS.map((step, index) => (
            <li key={step.stage} className={`step-${steps[index]}`}>
              <span className="mini-step-dot" aria-hidden="true">
                {steps[index] === "done" ? "✓" : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>

        {isFailed && job.failureReason && (
          <p className="job-failure-reason" role="note">
            {job.failureReason}
          </p>
        )}

        {isSuccess && (
          <p className="job-success-note">成品已整理，点击预览图查看结果。</p>
        )}
      </div>
    </article>
  );
}
