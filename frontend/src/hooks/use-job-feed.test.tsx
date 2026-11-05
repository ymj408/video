import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJobFeed } from "@/hooks/use-job-feed";
import { getJobs } from "@/lib/api";
import { JOB_POLL_INTERVAL_MS } from "@/lib/constants";
import type { Job } from "@/lib/types";
import { makeJob } from "@/test/factories";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getJobs: vi.fn(),
  };
});

const getJobsMock = vi.mocked(getJobs);

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useJobFeed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getJobsMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps multiple jobs independent and stops polling after all are terminal", async () => {
    const queued = makeJob({ id: "job_a", status: "QUEUED", stage: "QUEUED", progress: 4 });
    const processing = makeJob({ id: "job_b", status: "PROCESSING", stage: "VALIDATING" });
    getJobsMock
      .mockResolvedValueOnce([queued, processing])
      .mockResolvedValueOnce([
        makeJob({ id: "job_a", status: "SUCCEEDED", stage: "COMPLETED", progress: 100 }),
        makeJob({
          id: "job_b",
          status: "FAILED",
          stage: "FAILED",
          failureStage: "GENERATING",
          failureReason: "模拟失败：模拟生成阶段被调试开关中断。",
        }),
      ]);

    const { result } = renderHook(() => useJobFeed({ userId: "usr_junpeng" }));
    await flush();

    expect(result.current.jobs.map((job) => job.status)).toEqual(["QUEUED", "PROCESSING"]);

    await advance(JOB_POLL_INTERVAL_MS);

    expect(result.current.jobs.map((job) => job.status)).toEqual(["SUCCEEDED", "FAILED"]);
    expect(result.current.jobs[1]?.failureStage).toBe("GENERATING");
    expect(getJobsMock).toHaveBeenCalledTimes(2);

    await advance(JOB_POLL_INTERVAL_MS * 5);
    expect(getJobsMock).toHaveBeenCalledTimes(2);
  });

  it("treats a failed status query as a transport problem, not a job failure", async () => {
    const processing = makeJob({ id: "job_c", status: "PROCESSING", stage: "GENERATING" });
    getJobsMock
      .mockResolvedValueOnce([processing])
      .mockRejectedValueOnce(new Error("状态接口暂时不可用"))
      .mockResolvedValueOnce([
        makeJob({ id: "job_c", status: "SUCCEEDED", stage: "COMPLETED", progress: 100 }),
      ]);

    const { result } = renderHook(() => useJobFeed({ userId: "usr_junpeng" }));
    await flush();
    expect(result.current.jobs[0]?.status).toBe("PROCESSING");

    await advance(JOB_POLL_INTERVAL_MS);

    expect(result.current.jobs[0]?.status).toBe("PROCESSING");
    expect(result.current.initialError).toBeNull();
    expect(result.current.queryError).toContain("状态接口暂时不可用");
    expect(result.current.jobs[0]?.status).not.toBe("FAILED");

    await advance(JOB_POLL_INTERVAL_MS);

    expect(result.current.queryError).toBeNull();
    expect(result.current.jobs[0]?.status).toBe("SUCCEEDED");
  });

  it("does not let a stale list response overwrite a newly accepted job", async () => {
    getJobsMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useJobFeed({ userId: "usr_junpeng" }));
    await flush();
    expect(result.current.jobs).toHaveLength(0);

    let resolveRefresh: ((jobs: Job[]) => void) | undefined;
    getJobsMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    act(() => {
      void result.current.refresh();
    });
    await flush();

    const accepted = makeJob({ id: "job_new", status: "QUEUED", stage: "QUEUED" });
    act(() => {
      result.current.addJob(accepted);
    });
    expect(result.current.jobs.map((job) => job.id)).toContain("job_new");

    await act(async () => {
      resolveRefresh?.([]);
      await Promise.resolve();
    });

    expect(result.current.jobs.map((job) => job.id)).toEqual(["job_new"]);
  });

  it("cleans up the polling timer and ignores late responses after unmount", async () => {
    getJobsMock.mockResolvedValueOnce([
      makeJob({ id: "job_d", status: "PROCESSING", stage: "VALIDATING" }),
    ]);

    const { result, unmount } = renderHook(() => useJobFeed({ userId: "usr_junpeng" }));
    await flush();
    expect(result.current.jobs).toHaveLength(1);

    unmount();
    await advance(JOB_POLL_INTERVAL_MS * 3);

    expect(getJobsMock).toHaveBeenCalledTimes(1);
  });
});
