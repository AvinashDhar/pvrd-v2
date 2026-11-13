import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { MediaImage } from "@/components/catalogue/media-image";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteProduct, setProductStatus } from "@/lib/actions/products";
import { getProduct } from "@/lib/catalogue/queries";
import { fallbackImage } from "@/lib/media";
import { formatINR } from "@/lib/format";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" render={<Link href="/admin/products" />}>All products</Button>
        <Button render={<Link href={`/admin/products/${product.id}/edit`} />}>Edit product</Button>
        <form action={setProductStatus}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="status" value={product.status === "hidden" ? "active" : "hidden"} />
          <Button type="submit" variant="outline">{product.status === "hidden" ? "Restore" : "Hide"}</Button>
        </form>
        <ConfirmForm action={deleteProduct} message="Permanently delete this product and its images? This cannot be undone.">
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="destructive">Delete</Button>
        </ConfirmForm>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_1.15fr]">
        <div className="pvrd-card overflow-hidden">
          <MediaImage src={product.image || fallbackImage} alt={product.name} className="aspect-[4/3]" sizes="40vw" />
        </div>
        <div className="pvrd-card space-y-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-muted-foreground">{product.sku || "No SKU"} · {product.brandName || "No brand"}</p>
            </div>
            <StatusBadge value={product.status} />
          </div>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Category", product.categoryName],
              ["MRP", formatINR(product.mrp)],
              ["Price", formatINR(product.price)],
              ["Contractor discount", product.contractorDiscount ? `${product.contractorDiscount}%` : "—"],
              ["Consumer discount", product.consumerDiscount ? `${product.consumerDiscount}%` : "—"],
              ["Points", String(product.points ?? 0)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
          {Object.entries(product.attributes).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(product.attributes).map(([key, value]) => (
                <span key={key} className="rounded-full bg-muted px-2.5 py-1 text-xs">{key}: {value}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {product.variants.length > 0 ? (
        <div className="pvrd-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                {["Variant", "Finish", "Size", "Price", "Copy price"].map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr key={variant.id} className="pvrd-row">
                  <td className="px-4 py-3 font-medium">{variant.name}</td>
                  <td className="px-4 py-3">{variant.finish || "—"}</td>
                  <td className="px-4 py-3">{variant.size || "—"}</td>
                  <td className="px-4 py-3">{variant.price ? formatINR(variant.price) : "—"}</td>
                  <td className="px-4 py-3">{variant.copyPriceFromParent ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
