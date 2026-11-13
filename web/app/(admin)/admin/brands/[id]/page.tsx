import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandForm } from "@/components/admin/brand-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteBrand } from "@/lib/actions/brands";
import { getBrand, listCategories } from "@/lib/catalogue/queries";

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [brand, categories] = await Promise.all([getBrand(id), listCategories()]);
  if (!brand) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" render={<Link href="/admin/brands" />}>All brands</Button>
        <ConfirmForm action={deleteBrand} message="Delete this brand permanently?">
          <input type="hidden" name="id" value={brand.id} />
          <Button type="submit" variant="destructive" disabled={brand.productCount > 0}>Delete</Button>
        </ConfirmForm>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">{brand.productCount} products use this brand.</p>
      <BrandForm
        brand={brand}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      />
    </div>
  );
}
