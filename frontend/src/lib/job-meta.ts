import type { JobStage, JobStatus } from "@/lib/types";

export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: string; description: string }> = {
  QUEUED: {
    label: "等待处理",
    tone: "queued",
    description: "任务已受理，正在等待后台空闲线程",
  },
  PROCESSING: {
    label: "处理中",
    tone: "processing",
    description: "后台正在按步骤制作",
  },
  SUCCEEDED: {
    label: "已完成",
    tone: "success",
    description: "成品已生成，可以预览",
  },
  FAILED: {
    label: "制作失败",
    tone: "failed",
    description: "后台已停止，请查看失败阶段与原因",
  },
};

export const JOB_STAGE_META: Record<JobStage, { label: string; short: string }> = {
  QUEUED: { label: "等待处理", short: "排队" },
  VALIDATING: { label: "素材检查", short: "素材" },
  GENERATING: { label: "模拟生成", short: "生成" },
  FINALIZING: { label: "结果整理", short: "整理" },
  COMPLETED: { label: "制作完成", short: "完成" },
  FAILED: { label: "已停止", short: "停止" },
};

export const PIPELINE_STEPS: Array<{ stage: JobStage; label: string }> = [
  { stage: "VALIDATING", label: "素材检查" },
  { stage: "GENERATING", label: "模拟生成" },
  { stage: "FINALIZING", label: "结果整理" },
];

export type PipelineStepState = "pending" | "active" | "done" | "failed";

export function pipelineStates(job: {
  status: JobStatus;
  stage: JobStage;
  failureStage?: JobStage;
}): PipelineStepState[] {
  const indexByStage: Partial<Record<JobStage, number>> = {
    VALIDATING: 0,
    GENERATING: 1,
    FINALIZING: 2,
  };

  if (job.status === "SUCCEEDED") {
    return ["done", "done", "done"];
  }

  if (job.status === "FAILED") {
    const failedIndex = job.failureStage ? (indexByStage[job.failureStage] ?? -1) : -1;
    return PIPELINE_STEPS.map((_, index) => {
      if (index < failedIndex) return "done";
      if (index === failedIndex) return "failed";
      return "pending";
    });
  }

  if (job.status === "QUEUED") {
    return ["pending", "pending", "pending"];
  }

  const activeIndex = indexByStage[job.stage] ?? -1;
  return PIPELINE_STEPS.map((_, index) => {
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";
    return "pending";
  });
}

export function stageSummary(job: {
  status: JobStatus;
  stage: JobStage;
  failureStage?: JobStage;
}): string {
  if (job.status === "FAILED") {
    const failed = job.failureStage ?? job.stage;
    return `${JOB_STAGE_META[failed]?.label ?? "处理"}阶段失败`;
  }
  if (job.status === "SUCCEEDED") return "成品已生成";
  if (job.status === "QUEUED") return "等待后台开始处理";
  return `${JOB_STAGE_META[job.stage]?.label ?? "处理"}进行中`;
}

export function isActiveStatus(status: JobStatus): boolean {
  return status === "QUEUED" || status === "PROCESSING";
}
