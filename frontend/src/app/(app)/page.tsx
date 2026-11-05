"use client";

import { useEffect, useState } from "react";
import { CategoryTabs } from "@/components/category-tabs";
import { EmptyState, InlineError } from "@/components/feedback";
import { ArrowRightIcon, GridIcon, ImageIcon, SparklesIcon } from "@/components/icons";
import { TemplateCard } from "@/components/template-card";
import { errorMessage, getCategories, getTemplates, isAbortError } from "@/lib/api";
import type { Template, TemplateCategory } from "@/lib/types";

function TemplateSkeletonGrid() {
  return (
    <div className="template-grid" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <div className="template-skeleton" key={index}>
          <div className="skeleton skeleton-full" />
        </div>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [categoryReload, setCategoryReload] = useState(0);
  const [templateReload, setTemplateReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError(null);
    getCategories(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setCategoriesError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [categoryReload]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setTemplatesLoading(true);
    setTemplatesError(null);
    getTemplates(category, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setTemplates(data);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setTemplatesError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [category, templateReload]);

  const activeCategory = categories.find((item) => item.slug === category);

  return (
    <div className="templates-page">
      <section className="templates-hero" aria-labelledby="templates-title">
        <div className="templates-hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            MATERIAL STUDIO
          </p>
          <h1 id="templates-title">
            把一瞬，<em>做成作品。</em>
          </h1>
          <p className="templates-intro">
            选择一个模板，上传图片，剩下的交给后台。提交后无需留在页面，制作完成再回来查看。
          </p>
        </div>
        <div className="templates-hero-aside">
          <div className="hero-stat">
            <span className="hero-stat-icon"><GridIcon /></span>
            <span>
              <strong>{templatesLoading ? "—" : templates.length}</strong>
              <small>{activeCategory?.label ?? "全部"}模板</small>
            </span>
          </div>
          <div className="hero-note">
            <SparklesIcon />
            <p>本地模拟生成，不依赖真实 AI 服务</p>
          </div>
        </div>
      </section>

      <section className="catalog" aria-label="模板目录">
        <div className="catalog-toolbar">
          {categoriesError ? (
            <InlineError
              message={`分类加载失败：${categoriesError}`}
              onRetry={() => setCategoryReload((value) => value + 1)}
            />
          ) : (
            <CategoryTabs
              categories={categories}
              active={category}
              onChange={setCategory}
              loading={categoriesLoading}
            />
          )}
          <span className="catalog-count" aria-live="polite">
            <ImageIcon />
            {templatesLoading ? "加载中" : `${templates.length} 个模板`}
          </span>
        </div>

        {templatesError ? (
          <div className="catalog-error" role="alert">
            <h2>模板暂时没有加载出来</h2>
            <p>{templatesError}</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => setTemplateReload((value) => value + 1)}
            >
              重新加载模板
            </button>
          </div>
        ) : templatesLoading ? (
          <TemplateSkeletonGrid />
        ) : templates.length === 0 ? (
          <EmptyState
            title="这个分类还没有模板"
            description="试试其他分类，或回到全部模板继续挑选。"
            action={
              <button type="button" className="button secondary small" onClick={() => setCategory("all")}>
                查看全部模板
                <ArrowRightIcon />
              </button>
            }
          />
        ) : (
          <div className="template-grid">
            {templates.map((template, index) => (
              <TemplateCard key={template.id} template={template} priority={index < 6} />
            ))}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span>Luma Studio · Local creation workflow demo</span>
        <span>Spring Boot + Next.js</span>
      </footer>
    </div>
  );
}
