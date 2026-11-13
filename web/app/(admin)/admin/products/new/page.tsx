import { ProductForm } from "@/components/admin/product-form";
import { listBrands, listCategories } from "@/lib/catalogue/queries";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    listCategories(),
    listBrands({ status: "active" }),
  ]);

  return (
    <ProductForm
      categories={categories
        .filter((category) => category.status === "active")
        .map((category) => ({
          id: category.id,
          name: category.name,
          status: category.status,
          fields: category.fields,
          variantFields: category.variantFields,
          displayFormula: category.displayFormula,
        }))}
      brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
    />
  );
}
