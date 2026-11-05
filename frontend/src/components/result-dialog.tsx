"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { XIcon } from "@/components/icons";
import { formatFullDate } from "@/lib/format";
import type { Job } from "@/lib/types";

interface ResultDialogProps {
  job: Job | null;
  onClose: () => void;
}

export function ResultDialog({ job, onClose }: ResultDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (job && !dialog.open) {
      dialog.showModal();
    } else if (!job && dialog.open) {
      dialog.close();
    }
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [job]);

  return (
    <dialog
      ref={dialogRef}
      className="result-dialog"
      aria-labelledby="result-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      {job && (
        <div className="result-dialog-panel">
          <div className="result-dialog-header">
            <div>
              <p className="eyebrow">RESULT</p>
              <h2 id="result-dialog-title">{job.templateTitle}</h2>
              <p>
                完成于 {formatFullDate(job.finishedAt ?? job.updatedAt)}
                <span aria-hidden="true"> · </span>
                {job.assetCount} 张素材
              </p>
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="关闭成品预览">
              <XIcon />
            </button>
          </div>
          <div className="result-dialog-image">
            {job.resultUrl && (
              <Image
                src={job.resultUrl}
                alt={`「${job.templateTitle}」的成品预览`}
                width={1600}
                height={1200}
                priority
              />
            )}
          </div>
          <p className="result-dialog-note">
            这是由本地模拟生成器整理的示例成品，未调用真实 AI 服务。
          </p>
        </div>
      )}
    </dialog>
  );
}
