import Link from "next/link";
import { Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { MediaImage } from "@/components/catalogue/media-image";
import { listCategories } from "@/lib/catalogue/queries";
import { fallbackImage } from "@/lib/media";

export default async function CategoriesPage() {
  const categories = await listCategories();
  const active = categories.filter((category) => category.status === "active").length;
  const hidden = categories.filter((category) => category.status !== "active").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total categories" value={categories.length} icon={Layers3} tone="blue" />
        <StatCard label="Active" value={active} icon={Layers3} tone="green" />
        <StatCard label="Hidden" value={hidden} icon={Layers3} tone="orange" />
        <StatCard label="With variants" value={categories.filter((category) => category.variantFields.length > 0).length} icon={Layers3} tone="purple" />
      </section>

      <div className="flex justify-end">
        <Button render={<Link href="/admin/categories/new" />}>
          <Plus data-icon="inline-start" />
          Add category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/admin/categories/${category.id}`} className="pvrd-card overflow-hidden">
            <MediaImage src={category.imageUrl || fallbackImage} alt="" className="h-28" sizes="400px" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-heading font-semibold tracking-tight">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {category.productCount} products · {category.subcategories.length} subcategories · {category.fields.length} fields
                  </p>
                </div>
                <StatusBadge value={category.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {category.fields.slice(0, 6).map((field) => (
                  <span key={field.key} className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                    {field.label}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {category.variantFields.length > 0 ? "Variant schema enabled" : "No variants configured"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
