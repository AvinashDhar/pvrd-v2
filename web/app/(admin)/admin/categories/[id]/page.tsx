import Link from "next/link";
import { notFound } from "next/navigation";
import { NotifyForm } from "@/components/admin/notify-form";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { deleteCategory, setCategoryStatus } from "@/lib/actions/categories";
import { getCategory } from "@/lib/catalogue/queries";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Button variant="outline" size="sm" render={<Link href="/admin/categories" />}>
            All categories
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{category.name}</h1>
            <StatusBadge value={category.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {category.productCount} products · {category.subcategories.length} subcategories · {category.fields.length}{" "}
            fields
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NotifyForm action={setCategoryStatus}>
            <input type="hidden" name="id" value={category.id} />
            <input type="hidden" name="status" value={category.status === "active" ? "hidden" : "active"} />
            <Button type="submit" variant="outline">
              {category.status === "active" ? "Hide category" : "Make active"}
            </Button>
          </NotifyForm>
          <ConfirmForm
            action={deleteCategory}
            message="Delete this category permanently? This cannot be undone."
          >
            <input type="hidden" name="id" value={category.id} />
            <Button type="submit" variant="destructive" disabled={category.productCount > 0}>
              Delete
            </Button>
          </ConfirmForm>
        </div>
      </div>
      {category.productCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {category.productCount} products use this category. Delete stays unavailable until those products are removed.
          Hide keeps the products and takes the category off the website.
        </p>
      ) : null}
      <CategoryForm
        category={category}
        subcategories={category.subcategories.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          status: item.status,
          sortOrder: item.sortOrder,
          productCount: item.productCount,
          imageUrl: item.imageUrl,
          fields: item.fields,
          variantFields: item.variantFields,
        }))}
      />
    </div>
  );
}
