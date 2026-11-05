"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Brand } from "@/components/brand";
import {
  ArrowRightIcon,
  CheckIcon,
  ImageIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/icons";
import { errorMessage, getDemoUsers, isAbortError } from "@/lib/api";
import type { DemoUser } from "@/lib/types";

export default function LoginPage() {
  const { status, user, login } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoadingUsers(true);
    setLoadError(null);
    getDemoUsers(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
        setSelectedId((current) => current || data[0]?.id || "");
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken]);

  const selected = users.find((item) => item.id === selectedId) ?? null;

  const handleEnter = async () => {
    if (!selected || loggingIn) return;
    setLoginError(null);
    setLoggingIn(true);
    try {
      await login(selected.id);
      router.replace("/");
    } catch (error) {
      setLoginError(errorMessage(error));
    } finally {
      setLoggingIn(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && user)) {
    return (
      <main className="login-page">
        <div className="login-loading" role="status">
          <span className="login-loading-mark"><UserIcon /></span>
          <p>正在打开你的工作台…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="login-visual-top">
          <Brand />
          <span className="login-badge">LOCAL DEMO</span>
        </div>
        <div className="login-collage">
          <div className="collage-card collage-back">
            <Image src="/media/templates/holiday-lights.jpg" alt="" fill sizes="320px" />
          </div>
          <div className="collage-card collage-mid">
            <Image src="/media/templates/wedding-film.jpg" alt="" fill sizes="340px" />
          </div>
          <div className="collage-card collage-front">
            <Image src="/media/templates/pet-sticker.jpg" alt="" fill sizes="380px" />
            <span className="collage-caption">
              <span>PICK. UPLOAD.</span>
              <strong>MAKE IT YOURS.</strong>
            </span>
          </div>
        </div>
        <div className="login-visual-bottom">
          <p>
            浏览模板，上传影像，<br />
            把后台的等待变成一件作品。
          </p>
          <span>
            <SparklesIcon />
            MULTI-STEP · ASYNC · PERSISTED
          </span>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-inner">
          <div className="login-mobile-brand">
            <Brand />
          </div>
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            CHOOSE YOUR IDENTITY
          </p>
          <h1 id="login-title">
            进入 <em>Luma Studio</em>
          </h1>
          <p className="login-description">
            这是一个演示工作区。选择一个身份进入，素材、任务与个人制作记录会按账号隔离。
          </p>

          <div className="login-form" aria-busy={loadingUsers}>
            <div className="login-form-label">
              <span>选择演示账号</span>
              <span className="demo-pill">无需密码</span>
            </div>

            {loadError ? (
              <div className="login-error" role="alert">
                <p>账号列表加载失败：{loadError}</p>
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => setReloadToken((value) => value + 1)}
                >
                  重新加载
                </button>
              </div>
            ) : loadingUsers ? (
              <div className="user-choice-list" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="user-choice skeleton-user" key={index}>
                    <span className="skeleton skeleton-avatar" />
                    <span className="skeleton skeleton-line wide" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="login-error">
                <p>后端没有返回可用的演示账号，请检查数据库种子数据。</p>
              </div>
            ) : (
              <div className="user-choice-list" role="radiogroup" aria-label="选择演示账号">
                {users.map((demoUser) => {
                  const selectedCandidate = demoUser.id === selectedId;
                  return (
                    <button
                      key={demoUser.id}
                      type="button"
                      role="radio"
                      aria-checked={selectedCandidate}
                      className={`user-choice ${selectedCandidate ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedId(demoUser.id);
                        setLoginError(null);
                      }}
                    >
                      <span
                        className="account-avatar"
                        style={{ backgroundColor: demoUser.avatarColor }}
                        aria-hidden="true"
                      >
                        {demoUser.displayName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="user-choice-copy">
                        <strong>{demoUser.displayName}</strong>
                        <small>{demoUser.email}</small>
                      </span>
                      <span className="user-choice-meta">
                        <span>{demoUser.planName}</span>
                        <small>{demoUser.credits.toLocaleString("zh-CN")} credits</small>
                      </span>
                      <span className="user-choice-check" aria-hidden="true">
                        {selectedCandidate && <CheckIcon />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {loginError && (
              <div className="inline-error" role="alert">
                <ImageIcon />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="button"
              className="button primary login-submit"
              onClick={handleEnter}
              disabled={!selected || loadingUsers || loggingIn}
              aria-busy={loggingIn}
            >
              {loggingIn ? (
                <>
                  <span className="orbit-loader dark"><span /></span>
                  正在进入…
                </>
              ) : (
                <>
                  进入工作台
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </div>

          <p className="login-footnote">
            演示身份通过 <code>X-User-Id</code> 请求头传递，后端仍会校验任务与素材归属。
            这不是生产级鉴权方案。
          </p>
        </div>
      </section>
    </main>
  );
}
