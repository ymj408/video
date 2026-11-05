import type { TemplateCategory } from "@/lib/types";

interface CategoryTabsProps {
  categories: TemplateCategory[];
  active: string;
  onChange: (slug: string) => void;
  loading?: boolean;
}

export function CategoryTabs({ categories, active, onChange, loading = false }: CategoryTabsProps) {
  if (loading && categories.length === 0) {
    return (
      <div className="category-tabs" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, index) => (
          <span className="skeleton chip-skeleton" key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="category-tabs" role="group" aria-label="按分类筛选模板">
      {categories.map((category) => {
        const selected = active === category.slug;
        return (
          <button
            key={category.slug}
            type="button"
            className={`category-chip ${selected ? "active" : ""}`}
            aria-pressed={selected}
            onClick={() => onChange(category.slug)}
          >
            <span>{category.label}</span>
            <small>{String(category.count).padStart(2, "0")}</small>
          </button>
        );
      })}
    </div>
  );
}
