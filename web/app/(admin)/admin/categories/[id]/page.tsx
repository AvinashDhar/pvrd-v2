import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteCategory, setCategoryStatus } from "@/lib/actions/categories";
import { getCategory } from "@/lib/catalogue/queries";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const category = await getCategory(id);
  if (!category) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" render={<Link href="/admin/categories" />}>All categories</Button>
        <div className="flex flex-wrap gap-2">
          <form action={setCategoryStatus}>
            <input type="hidden" name="id" value={category.id} />
            <input type="hidden" name="status" value={category.status === "active" ? "hidden" : "active"} />
            <Button type="submit" variant="outline">
              {category.status === "active" ? "Hide category" : "Make active"}
            </Button>
          </form>
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {category.productCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {category.productCount} products use this category. Delete stays unavailable until those products are removed. Hide keeps the products and takes the category off the website.
        </p>
      ) : null}
      <CategoryForm category={category} />
    </div>
  );
}
