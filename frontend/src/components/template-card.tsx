import Image from "next/image";
import Link from "next/link";
import { ImageIcon, SparkleIcon } from "@/components/icons";
import type { Template } from "@/lib/types";

export function TemplateCard({ template, priority = false }: { template: Template; priority?: boolean }) {
  return (
    <Link
      href={`/templates/${template.id}`}
      className="template-card"
      aria-label={`打开模板「${template.title}」，需要 ${template.requiredImageCount} 张图片`}
    >
      <Image
        src={template.coverUrl}
        alt={`「${template.title}」模板封面`}
        fill
        sizes="(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 210px"
        className="template-cover"
        priority={priority}
      />
      <span className="template-shade" aria-hidden="true" />
      <span className="template-top">
        <span className="template-category">{template.categoryLabel}</span>
        {template.featured && (
          <span className="template-featured" title="热门模板">
            <SparkleIcon />
          </span>
        )}
      </span>
      <span className="template-info">
        <span className="template-title">{template.title}</span>
        <span className="template-meta">
          <ImageIcon />
          需要 {template.requiredImageCount} 张图片
        </span>
      </span>
      <span className="template-cta" aria-hidden="true">
        使用模板
        <span>↗</span>
      </span>
    </Link>
  );
}
