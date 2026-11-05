import type { Job, JobStage, JobStatus } from "@/lib/types";

let sequence = 0;

export function makeJob(overrides: Partial<Job> = {}): Job {
  sequence += 1;
  const status: JobStatus = overrides.status ?? "PROCESSING";
  const stage: JobStage =
    overrides.stage ??
    (status === "QUEUED"
      ? "QUEUED"
      : status === "SUCCEEDED"
        ? "COMPLETED"
        : status === "FAILED"
          ? "FAILED"
          : "GENERATING");

  return {
    id: `job_test_${sequence}`,
    templateId: "pet-sticker",
    templateTitle: "毛球贴纸",
    templateCoverUrl: "/media/templates/pet-sticker.jpg",
    status,
    stage,
    progress: status === "SUCCEEDED" ? 100 : status === "QUEUED" ? 4 : 55,
    assetCount: 1,
    resultUrl: status === "SUCCEEDED" ? "/media/results/pet-sticker.jpg" : undefined,
    failureStage: status === "FAILED" ? "GENERATING" : undefined,
    failureReason:
      status === "FAILED" ? "模拟失败：模拟生成阶段被调试开关中断。" : undefined,
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:01:00Z",
    assets: [],
    ...overrides,
  };
}
