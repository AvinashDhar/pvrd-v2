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
        subcategories: category.subcategories.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          fields: item.fields,
          variantFields: item.variantFields,
        })),
      }))}
      brands={brandOptions}
      product={{
        id: product.id,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        brandId: product.brandId,
        name: product.name,
        sku: product.sku,
        mrp: product.mrp,
        price: product.price,
        contractorDiscount: product.contractorDiscount,
        consumerDiscount: product.consumerDiscount,
        points: product.points,
        description: product.description,
        attributesText: product.attributesText,
        status: product.status,
        attributes: product.attributes,
        images: product.images.map((image) => ({
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary,
        })),
        variants: product.variants.map((variant) => {
          const stored = (variant.attributes ?? {}) as Record<string, unknown>;
          const copy = stored._copy && typeof stored._copy === "object" ? { ...(stored._copy as Record<string, boolean>) } : {};
          if (variant.copyPriceFromParent) copy.price = true;
          const values: Record<string, string> = {
            name: variant.name,
            finish: variant.finish ?? "",
            size: variant.size ?? "",
            price: variant.price ?? "",
          };
          for (const [key, value] of Object.entries(stored)) {
            if (key.startsWith("_")) continue;
            values[key] = value == null ? "" : String(value);
          }
          return { id: variant.id, values, copy, imageUrl: variant.imageUrl, hasImage: Boolean(variant.imageUrl) };
        }),
      }}
    />
  );
}
