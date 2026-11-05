"use client";

import type { ReactNode } from "react";
import { AlertTriangleIcon, CheckCircleIcon, ImageIcon, RefreshIcon } from "@/components/icons";

export function EmptyState({
  title,
  description,
  action,
  icon = "image",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "image" | "check";
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {icon === "check" ? <CheckCircleIcon /> : <ImageIcon />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function QueryErrorBanner({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="query-error-banner" role="status" aria-live="polite">
      <span className="query-error-icon" aria-hidden="true">
        <AlertTriangleIcon />
      </span>
      <div>
        <strong>状态刷新暂时中断，任务仍在后台继续</strong>
        <p>{message}。已保留最后一次可用的任务信息，不会把请求异常当作制作失败。</p>
      </div>
      <button type="button" className="button small ghost" onClick={onRetry} disabled={retrying}>
        <RefreshIcon />
        {retrying ? "刷新中" : "重新连接"}
      </button>
    </div>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="inline-error" role="alert">
      <AlertTriangleIcon />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="text-button" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  );
}
