"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, GridIcon, LogOutIcon, ShieldIcon, SwitchIcon, XIcon } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { formatDateTime, initials } from "@/lib/format";

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountDialog({ open, onClose }: AccountDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = () => {
    onClose();
    logout();
    router.replace("/login");
  };

  const handleSwitch = () => {
    onClose();
    logout();
    router.replace("/login");
  };

  return (
    <dialog
      ref={dialogRef}
      className="account-dialog"
      aria-labelledby="account-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      <div className="account-dialog-panel">
        <header className="account-dialog-header">
          <div>
            <p className="eyebrow">ACCOUNT</p>
            <h2 id="account-dialog-title">账户设置</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭账户设置">
            <XIcon />
          </button>
        </header>

        <section className="account-hero" aria-label="账号信息">
          <span
            className="account-avatar account-avatar-large"
            style={{ backgroundColor: user.avatarColor }}
            aria-hidden="true"
          >
            {initials(user.displayName)}
          </span>
          <div className="account-hero-copy">
            <strong>{user.displayName}</strong>
            <span>{user.email}</span>
            <span className="account-plan">
              {user.planName}
              <span aria-hidden="true">·</span>
              {user.credits.toLocaleString("zh-CN")} credits
            </span>
          </div>
        </section>

        <section className="account-fields" aria-label="账号详情">
          <div className="account-field">
            <span>邮箱</span>
            <strong>{user.email}</strong>
          </div>
          <div className="account-field">
            <span>登录方式</span>
            <strong>本地演示身份（无需密码）</strong>
          </div>
          <div className="account-field">
            <span>创建时间</span>
            <strong>{formatDateTime(user.createdAt)}</strong>
          </div>
        </section>

        <div className="account-note">
          <ShieldIcon />
          <p>
            当前使用演示身份。服务端仍按账号隔离素材与制作记录；切换到另一个账号即可看到独立的个人历史。
          </p>
        </div>

        <div className="account-actions">
          <button
            type="button"
            className="account-action"
            onClick={() => {
              onClose();
              router.push("/history");
            }}
          >
            <span className="account-action-icon"><GridIcon /></span>
            <span>
              <strong>我的制作记录</strong>
              <small>查看进行中与已完成的成品</small>
            </span>
            <ChevronRightIcon className="account-action-arrow" />
          </button>
          <button type="button" className="account-action" onClick={handleSwitch}>
            <span className="account-action-icon"><SwitchIcon /></span>
            <span>
              <strong>切换演示账号</strong>
              <small>回到身份选择页</small>
            </span>
            <ChevronRightIcon className="account-action-arrow" />
          </button>
          <button type="button" className="account-action account-action-danger" onClick={handleLogout}>
            <span className="account-action-icon"><LogOutIcon /></span>
            <span>
              <strong>退出登录</strong>
              <small>停止当前页面的状态跟踪</small>
            </span>
            <ChevronRightIcon className="account-action-arrow" />
          </button>
        </div>

        <p className="account-footnote">Luma Studio · Demo workspace · v1.0</p>
      </div>
    </dialog>
  );
}
