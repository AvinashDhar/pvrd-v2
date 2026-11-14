import Link from "next/link";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductThumb } from "@/components/admin/product-thumb";
import { listBrands, listCategories } from "@/lib/catalogue/queries";
import { fallbackImage } from "@/lib/media";
import { formatDate } from "@/lib/format";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string }>;
}) {
  const filters = await searchParams;
  const [brands, categories] = await Promise.all([
    listBrands(filters),
    listCategories(),
  ]);
  const active = brands.filter((brand) => brand.status === "active").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total brands" value={brands.length} icon={Award} tone="blue" />
        <StatCard label="Active" value={active} icon={Award} tone="green" />
        <StatCard label="Inactive" value={brands.length - active} icon={Award} tone="red" />
        <StatCard label="Top brand products" value={brands.reduce((max, brand) => Math.max(max, brand.productCount), 0)} icon={Award} tone="purple" />
      </section>

      <form className="pvrd-card grid min-w-0 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" action="/admin/brands">
        <label className="grid min-w-0 gap-1.5 lg:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <Input name="q" defaultValue={filters.q} placeholder="Brand name" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Category</span>
          <select name="categoryId" defaultValue={filters.categoryId ?? ""} className="pvrd-select">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select name="status" defaultValue={filters.status ?? "all"} className="pvrd-select">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <Button type="submit" className="flex-1">Search</Button>
          <Button variant="outline" render={<Link href="/admin/brands" />}>Reset</Button>
        </div>
      </form>

      <div className="flex justify-end">
        <Button render={<Link href="/admin/brands/new" />}>Add brand</Button>
      </div>

      <div className="pvrd-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              {["Brand", "Categories", "Products", "Status", "Created", ""].map((column) => (
                <th key={column} className="px-4 py-3 font-medium">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="pvrd-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb name={brand.name} image={brand.logoUrl || fallbackImage} />
                    <span className="font-medium">{brand.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{brand.categoryNames.join(", ") || "—"}</td>
                <td className="px-4 py-3">{brand.productCount}</td>
                <td className="px-4 py-3"><StatusBadge value={brand.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(brand.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" render={<Link href={`/admin/brands/${brand.id}`} />}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {brands.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No brands match this search.</p> : null}
      </div>
    </div>
  );
}
