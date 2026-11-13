import { BrandForm } from "@/components/admin/brand-form";
import { listCategories } from "@/lib/catalogue/queries";

export default async function NewBrandPage() {
  const categories = await listCategories();
  return <BrandForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />;
}
