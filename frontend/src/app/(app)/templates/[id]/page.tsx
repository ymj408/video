import type { Metadata } from "next";
import { TemplateDetailPage } from "@/components/template-detail-page";

export const metadata: Metadata = {
  title: "模板详情",
};

export default async function TemplateDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateDetailPage templateId={id} />;
}
