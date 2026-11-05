"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, AuthSplash } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import { AlertCircleIcon } from "@/components/icons";

export function AppShell({ children }: { children: ReactNode }) {
  const { status, user, error, retry, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <AuthSplash />;
  }

  if (status === "anonymous") {
    return <AuthSplash message="正在前往身份选择…" />;
  }

  if (status === "error") {
    return (
      <main className="centered-state">
        <div className="state-card">
          <span className="state-icon state-icon-danger"><AlertCircleIcon /></span>
          <h1>暂时无法验证演示身份</h1>
          <p>{error ?? "后端服务可能还未启动。"}</p>
          <div className="state-actions">
            <button type="button" className="button primary" onClick={retry}>
              重试连接
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              重新选择账号
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthSplash />;
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page-shell">{children}</main>
    </div>
  );
}
