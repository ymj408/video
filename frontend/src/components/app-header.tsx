"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AccountDialog } from "@/components/account-dialog";
import { useAuth } from "@/components/auth-provider";
import { Brand } from "@/components/brand";
import { GridIcon, LayersIcon, UserIcon } from "@/components/icons";
import { initials } from "@/lib/format";

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="main-nav" aria-label="主导航">
            <Link
              href="/"
              className={`nav-link ${pathname === "/" ? "active" : ""}`}
              aria-current={pathname === "/" ? "page" : undefined}
            >
              <LayersIcon />
              <span>模板库</span>
            </Link>
            <Link
              href="/history"
              className={`nav-link ${pathname === "/history" ? "active" : ""}`}
              aria-current={pathname === "/history" ? "page" : undefined}
            >
              <GridIcon />
              <span>我的制作</span>
            </Link>
          </nav>

          <div className="header-account">
            <span className="plan-chip" title="演示账号方案">
              {user.planName}
            </span>
            <span className="credit-chip">
              <strong>{user.credits.toLocaleString("zh-CN")}</strong>
              <span>credits</span>
            </span>
            <button
              type="button"
              className="user-menu-button"
              onClick={() => setAccountOpen(true)}
              aria-label={`打开账户设置，当前用户 ${user.displayName}`}
              aria-haspopup="dialog"
            >
              <span
                className="account-avatar"
                style={{ backgroundColor: user.avatarColor }}
                aria-hidden="true"
              >
                {initials(user.displayName)}
              </span>
              <span className="user-menu-name">{user.displayName}</span>
            </button>
            <button type="button" className="text-button header-logout" onClick={handleLogout}>
              退出
            </button>
          </div>
        </div>
      </header>
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}

export function AuthSplash({ message = "正在准备工作台…" }: { message?: string }) {
  return (
    <div className="auth-splash" role="status" aria-live="polite">
      <span className="brand-mark brand-mark-large" aria-hidden="true">
        <UserIcon />
      </span>
      <span className="loading-line" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
