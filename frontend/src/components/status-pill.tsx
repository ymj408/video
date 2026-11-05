import type { JobStatus } from "@/lib/types";
import { JOB_STATUS_META } from "@/lib/job-meta";

export function StatusPill({ status, compact = false }: { status: JobStatus; compact?: boolean }) {
  const meta = JOB_STATUS_META[status];
  return (
    <span className={`status-pill status-${meta.tone} ${compact ? "is-compact" : ""}`}>
      <span className="status-dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
