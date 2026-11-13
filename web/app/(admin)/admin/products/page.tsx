import Link from "next/link";
import { List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductThumb } from "@/components/admin/product-thumb";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteProduct } from "@/lib/actions/products";
import { listBrands, listCategories, listProducts, productStats } from "@/lib/catalogue/queries";
import { formatINR } from "@/lib/format";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; brandId?: string; status?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const filters = await searchParams;
  const [items, categories, brands, stats] = await Promise.all([
    listProducts(filters),
    listCategories(),
    listBrands(),
    productStats(),
  ]);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={stats.total} icon={List} tone="blue" />
        <StatCard label="Added this month" value={stats.thisMonth} icon={Plus} tone="green" />
        <StatCard label="Active" value={stats.active} icon={Search} tone="purple" />
        <StatCard label="Hidden" value={stats.hidden} icon={Search} tone="orange" />
      </section>

      <form action="/admin/products" className="pvrd-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="grid gap-1.5 xl:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <Input name="q" defaultValue={filters.q} placeholder="Name, SKU, category, brand" />
        </label>
        <Select name="categoryId" label="Category" value={filters.categoryId} options={categories.map((category) => ({ value: category.id, label: category.name }))} />
        <Select name="brandId" label="Brand" value={filters.brandId} options={brands.map((brand) => ({ value: brand.id, label: brand.name }))} />
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select name="status" defaultValue={filters.status ?? "all"} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Min price</span>
          <Input name="minPrice" type="number" min="0" defaultValue={filters.minPrice} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Max price</span>
          <Input name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice} />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">Search</Button>
          <Button variant="outline" render={<Link href="/admin/products" />}>Reset</Button>
        </div>
      </form>

      <div className="pvrd-card overflow-hidden">
        <div className="flex justify-end px-4 py-3">
          <Button render={<Link href="/admin/products/new" />}>
            <Plus data-icon="inline-start" />
            Add Product
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                {["Product", "SKU", "Category", "Brand", "MRP", "Price", "Status", ""].map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id} className="pvrd-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductThumb name={product.name} image={product.image} />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.sku || "—"}</td>
                  <td className="px-4 py-3">{product.categoryName}</td>
                  <td className="px-4 py-3">{product.brandName || "—"}</td>
                  <td className="px-4 py-3">{formatINR(product.mrp)}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(product.price)}</td>
                  <td className="px-4 py-3"><StatusBadge value={product.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/admin/products/${product.id}`} />}>View</Button>
                    <Button variant="ghost" size="sm" render={<Link href={`/admin/products/${product.id}/edit`} />}>Edit</Button>
                    <ConfirmForm action={deleteProduct} message={`Delete ${product.name}? This cannot be undone.`}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button type="submit" variant="ghost" size="sm">Delete</Button>
                    </ConfirmForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[#003c6c]/8 px-4 py-3 text-xs text-muted-foreground">
          Showing {items.length} product{items.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
