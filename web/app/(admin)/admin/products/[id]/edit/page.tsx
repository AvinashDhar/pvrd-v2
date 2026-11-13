import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getProduct, listBrands, listCategories } from "@/lib/catalogue/queries";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getProduct(id),
    listCategories(),
    listBrands({ status: "active" }),
  ]);
  if (!product) notFound();

  const selectable = categories.filter(
    (category) => category.status === "active" || category.id === product.categoryId,
  );
  const brandOptions = brands.map((brand) => ({ id: brand.id, name: brand.name }));
  if (product.brandId && !brandOptions.some((brand) => brand.id === product.brandId)) {
    brandOptions.push({ id: product.brandId, name: product.brandName || "Current brand" });
  }

  return (
    <ProductForm
      categories={selectable.map((category) => ({
        id: category.id,
        name: category.name,
        status: category.status,
        fields: category.fields,
        variantFields: category.variantFields,
        displayFormula: category.displayFormula,
      }))}
      brands={brandOptions}
      product={{
        id: product.id,
        categoryId: product.categoryId,
        brandId: product.brandId,
        name: product.name,
        sku: product.sku,
        mrp: product.mrp,
        price: product.price,
        contractorDiscount: product.contractorDiscount,
        consumerDiscount: product.consumerDiscount,
        points: product.points,
        description: product.description,
        status: product.status,
        attributes: product.attributes,
        images: product.images.map((image) => ({
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary,
        })),
        variants: product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          finish: variant.finish ?? "",
          size: variant.size ?? "",
          price: variant.price ?? "",
          copyPrice: Boolean(variant.copyPriceFromParent),
        })),
      }}
    />
  );
}
