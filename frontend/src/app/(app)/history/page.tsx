"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { JobBoard } from "@/components/job-board";
import {
  CheckCircleIcon,
  ClockIcon,
  GridIcon,
  PlusIcon,
  RefreshIcon,
  AlertCircleIcon,
} from "@/components/icons";
import { useJobFeed } from "@/hooks/use-job-feed";
import { isActiveStatus } from "@/lib/job-meta";

type Filter = "all" | "active" | "succeeded" | "failed";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "active", label: "进行中" },
  { key: "succeeded", label: "已完成" },
  { key: "failed", label: "失败" },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const feed = useJobFeed({ userId, limit: 100 });
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const active = feed.jobs.filter((job) => isActiveStatus(job.status)).length;
    const succeeded = feed.jobs.filter((job) => job.status === "SUCCEEDED").length;
    const failed = feed.jobs.filter((job) => job.status === "FAILED").length;
    return { active, succeeded, failed };
  }, [feed.jobs]);

  const filteredJobs = useMemo(() => {
    return feed.jobs.filter((job) => {
      if (filter === "all") return true;
      if (filter === "active") return isActiveStatus(job.status);
      if (filter === "succeeded") return job.status === "SUCCEEDED";
      return job.status === "FAILED";
    });
  }, [feed.jobs, filter]);

  const counts: Record<Filter, number> = {
    all: feed.jobs.length,
    active: stats.active,
    succeeded: stats.succeeded,
    failed: stats.failed,
  };

  const emptyCopy = filter === "all"
    ? {
        title: "还没有制作记录",
        description: "选一个模板，上传图片，创建你的第一个异步制作任务。",
      }
    : filter === "active"
      ? {
          title: "没有进行中的任务",
          description: "当前账号的所有任务都已经结束，可以创建新的制作。",
        }
      : filter === "succeeded"
        ? {
            title: "还没有成功的作品",
            description: "一个任务完成后，成品会出现在这里，点击预览即可查看。",
          }
        : {
            title: "没有失败的任务",
            description: "很好，当前账号暂时没有制作失败记录。",
          };

  return (
    <div className="history-page">
      <header className="history-page-header">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            PERSONAL ARCHIVE
          </p>
          <h1>我的制作</h1>
          <p>
            所有任务都由服务端持久化。刷新、离开或切换页面后，未结束的任务仍会被自动跟踪。
          </p>
        </div>
        <Link className="button primary" href="/">
          <PlusIcon />
          新建制作
        </Link>
      </header>

      <section className="stats-strip" aria-label="制作统计">
        <div className="stat-block">
          <span className="stat-icon stat-icon-active"><ClockIcon /></span>
          <span>
            <small>进行中</small>
            <strong>{feed.loading ? "—" : stats.active}</strong>
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-icon stat-icon-success"><CheckCircleIcon /></span>
          <span>
            <small>已完成</small>
            <strong>{feed.loading ? "—" : stats.succeeded}</strong>
          </span>
        </div>
        <div className="stat-block">
          <span className="stat-icon stat-icon-failed"><AlertCircleIcon /></span>
          <span>
            <small>失败</small>
            <strong>{feed.loading ? "—" : stats.failed}</strong>
          </span>
        </div>
        <div className="stats-note">
          <span className={`live-dot ${stats.active > 0 ? "on" : ""}`} aria-hidden="true" />
          {stats.active > 0 ? `正在自动更新 ${stats.active} 个任务` : "暂无需要跟踪的任务"}
        </div>
      </section>

      <section className="history-content" aria-labelledby="history-list-title">
        <div className="history-content-header">
          <div className="filter-tabs" role="group" aria-label="按任务状态筛选">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`filter-tab ${filter === item.key ? "active" : ""}`}
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
                <span>{counts[item.key]}</span>
              </button>
            ))}
          </div>
          <div className="history-content-actions">
            <span className="record-count">
              <GridIcon />
              {feed.loading ? "读取中" : `${filteredJobs.length} 条记录`}
            </span>
            <button
              type="button"
              className="button ghost small"
              onClick={() => void feed.refresh()}
              disabled={feed.isRefreshing}
            >
              <RefreshIcon />
              {feed.isRefreshing ? "刷新中" : "刷新"}
            </button>
          </div>
        </div>

        <h2 id="history-list-title" className="sr-only">
          任务记录列表
        </h2>
        <JobBoard
          jobs={filteredJobs}
          loading={feed.loading}
          initialError={feed.initialError}
          queryError={feed.queryError}
          isRefreshing={feed.isRefreshing}
          onRefresh={() => void feed.refresh()}
          onRetryInitial={() => void feed.retryInitial()}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          layout="wide"
          skeletonCount={4}
        />
      </section>
    </div>
  );
}
