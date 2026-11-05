"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { JobBoard } from "@/components/job-board";
import { Uploader } from "@/components/uploader";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImageIcon,
  RefreshIcon,
  SparklesIcon,
} from "@/components/icons";
import { useJobFeed } from "@/hooks/use-job-feed";
import {
  ApiError,
  createJob,
  errorMessage,
  getTemplate,
  isAbortError,
} from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { Template } from "@/lib/types";

export function TemplateDetailPage({ templateId }: { templateId: string }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const feed = useJobFeed({ userId, templateId, limit: 30 });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    getTemplate(templateId, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setTemplate(data);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(errorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [templateId, reloadToken]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-back-row">
          <div className="skeleton skeleton-line" style={{ width: 120 }} />
        </div>
        <div className="detail-layout">
          <div className="create-panel">
            <div className="skeleton detail-cover-skeleton" />
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton detail-upload-skeleton" />
          </div>
          <div className="history-panel">
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton detail-history-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="detail-page">
        <div className="centered-state in-page">
          <div className="state-card">
            <span className="state-icon"><ImageIcon /></span>
            <h1>这个模板不存在</h1>
            <p>模板可能已下架，或地址里的编号有误。</p>
            <Link className="button primary" href="/">
              <ArrowLeftIcon />
              返回模板库
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !template) {
    return (
      <div className="detail-page">
        <div className="centered-state in-page">
          <div className="state-card">
            <h1>模板暂时没有加载出来</h1>
            <p>{loadError ?? "未知错误"}</p>
            <div className="state-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => setReloadToken((value) => value + 1)}
              >
                重新加载
              </button>
              <Link className="button ghost" href="/">
                返回模板库
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveJob = feed.jobs.some(
    (job) => job.status === "QUEUED" || job.status === "PROCESSING",
  );

  const handleSubmit = async (assetIds: string[]) => {
    if (!user) {
      throw new Error("登录状态已失效，请重新选择账号");
    }
    const job = await createJob(user.id, { templateId: template.id, assetIds });
    feed.addJob(job);
  };

  return (
    <div className="detail-page">
      <div className="detail-back-row">
        <Link className="back-link" href="/">
          <ArrowLeftIcon />
          返回模板库
        </Link>
        <span className="breadcrumb" aria-hidden="true">
          <span>/</span>
          {template.categoryLabel}
          <span>/</span>
          制作
        </span>
        <Link className="text-link detail-all-jobs" href="/history">
          全部制作记录
          <ArrowRightIcon />
        </Link>
      </div>

      <div className="detail-layout">
        <section className="create-panel" aria-labelledby="template-title">
          <div className="template-preview">
            <Image
              src={template.coverUrl}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              className="template-preview-backdrop"
              priority
            />
            <div className="template-preview-frame">
              <Image
                src={template.coverUrl}
                alt={`「${template.title}」模板示例`}
                fill
                sizes="(max-width: 900px) 90vw, 380px"
                className="template-preview-image"
                priority
              />
            </div>
            <span className="template-preview-label">
              <SparklesIcon />
              示例封面
            </span>
          </div>

          <div className="template-copy">
            <div className="template-copy-top">
              <span className="template-category">{template.categoryLabel}</span>
              {template.featured && <span className="featured-label">热门模板</span>}
            </div>
            <h1 id="template-title">{template.title}</h1>
            <p>{template.description}</p>
          </div>

          <dl className="requirement-grid">
            <div>
              <dt>素材数量</dt>
              <dd>{template.requiredImageCount} 张</dd>
            </div>
            <div>
              <dt>支持格式</dt>
              <dd>{template.acceptedMimeTypes.map((type) => type.replace("image/", "").toUpperCase()).join(" / ")}</dd>
            </div>
            <div>
              <dt>单张上限</dt>
              <dd>{formatBytes(template.maxFileSizeBytes)}</dd>
            </div>
          </dl>

          {userId && (
            <Uploader
              key={template.id}
              template={template}
              userId={userId}
              onSubmit={handleSubmit}
            />
          )}
        </section>

        <section className="history-panel" aria-labelledby="history-heading">
          <header className="history-panel-header">
            <div>
              <div className="history-title-row">
                <h2 id="history-heading">制作记录</h2>
                <span className="count-badge">{feed.jobs.length}</span>
                {hasActiveJob && (
                  <span className="live-indicator">
                    <span aria-hidden="true" />
                    自动更新中
                  </span>
                )}
              </div>
              <p>此模板下由当前账号创建的任务，离开页面后后台仍会继续。</p>
            </div>
            <button
              type="button"
              className="button ghost small"
              onClick={() => void feed.refresh()}
              disabled={feed.isRefreshing}
            >
              <RefreshIcon />
              {feed.isRefreshing ? "刷新中" : "刷新"}
            </button>
          </header>

          <JobBoard
            jobs={feed.jobs}
            loading={feed.loading}
            initialError={feed.initialError}
            queryError={feed.queryError}
            isRefreshing={feed.isRefreshing}
            onRefresh={() => void feed.refresh()}
            onRetryInitial={() => void feed.retryInitial()}
            emptyTitle="这个模板还没有作品"
            emptyDescription="上传素材并提交后，任务会出现在这里，处理进度由服务端驱动。"
            layout="compact"
            skeletonCount={3}
          />
        </section>
      </div>

      <div className="detail-footnote">
        <span>任务提交后立即返回任务编号，后台按「素材检查 → 模拟生成 → 结果整理」执行。</span>
        <span>查询只读取状态，不会推动任务前进一步。</span>
      </div>
    </div>
  );
}
