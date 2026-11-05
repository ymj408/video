import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobBoard } from "@/components/job-board";
import { makeJob } from "@/test/factories";

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("JobBoard", () => {
  it("renders independent job outcomes and separates a query error from task failure", () => {
    const processing = makeJob({
      id: "job_processing",
      templateTitle: "海岸明信片",
      status: "PROCESSING",
      stage: "GENERATING",
    });
    const failed = makeJob({
      id: "job_failed",
      templateTitle: "冰晶肖像",
      status: "FAILED",
      stage: "FAILED",
      failureStage: "GENERATING",
      failureReason: "模拟失败：模拟生成阶段被调试开关中断。",
    });
    const succeeded = makeJob({
      id: "job_done",
      templateTitle: "暮光婚礼",
      status: "SUCCEEDED",
      stage: "COMPLETED",
      progress: 100,
    });

    render(
      <JobBoard
        jobs={[processing, failed, succeeded]}
        loading={false}
        initialError={null}
        queryError="状态接口暂时不可用"
        isRefreshing={false}
        onRefresh={vi.fn()}
        onRetryInitial={vi.fn()}
      />,
    );

    expect(
      screen.getByText("状态刷新暂时中断，任务仍在后台继续"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/不会把请求异常当作制作失败/),
    ).toBeInTheDocument();

    const processingCard = screen.getByText("海岸明信片").closest("article");
    const failedCard = screen.getByText("冰晶肖像").closest("article");
    const succeededCard = screen.getByText("暮光婚礼").closest("article");

    expect(processingCard).not.toBeNull();
    expect(failedCard).not.toBeNull();
    expect(succeededCard).not.toBeNull();

    expect(within(processingCard!).getByText("处理中")).toBeInTheDocument();
    expect(within(failedCard!).getByText("制作失败")).toBeInTheDocument();
    expect(within(failedCard!).getByText(/模拟失败/)).toBeInTheDocument();
    expect(within(succeededCard!).getByText("已完成")).toBeInTheDocument();
    expect(screen.getByText("状态接口暂时不可用。已保留最后一次可用的任务信息，不会把请求异常当作制作失败。"))
      .toBeInTheDocument();
  });
});
