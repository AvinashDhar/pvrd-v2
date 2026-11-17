import Link from "next/link";
import { List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductThumb } from "@/components/admin/product-thumb";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteProduct } from "@/lib/actions/products";
import { listBrands, listCategories, listProducts, productAnalytics, productStats } from "@/lib/catalogue/queries";
import { ProductListForm, SelectAll } from "@/components/admin/product-list-form";
import { formatINR } from "@/lib/format";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; brandId?: string; status?: string; minPrice?: string; maxPrice?: string; sort?: string; dir?: string }>;
}) {
  const filters = await searchParams;
  const [items, categories, brands, stats, analytics] = await Promise.all([
    listProducts(filters),
    listCategories(),
    listBrands(),
    productStats(),
    productAnalytics(),
  ]);
  const sort = filters.sort ?? "created";
  const dir = filters.dir === "asc" ? "asc" : "desc";

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={stats.total} icon={List} tone="blue" />
        <StatCard label="Added this month" value={stats.thisMonth} icon={Plus} tone="green" />
        <StatCard label="Active" value={stats.active} icon={Search} tone="purple" />
        <StatCard label="Hidden" value={stats.hidden} icon={Search} tone="orange" />
      </section>

      <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <RankList title="Most viewed" rows={analytics.viewed.map((item) => ({ label: item.name, value: `${item.total} views` }))} empty="No product views yet." />
        <RankList title="Most downloaded" rows={analytics.downloaded.map((item) => ({ label: item.name, value: `${item.total} downloads` }))} empty="No catalogue downloads yet." />
        <RankList title="Top categories" rows={analytics.topCategories.map((item) => ({ label: item.name, value: `${item.total} views` }))} empty="No category views yet." />
        <RankList title="Low visibility" rows={analytics.lowVisibility.map((item) => ({ label: item.name, value: item.status === "active" ? `${item.total} views` : item.status }))} empty="No products yet." />
      </section>

      <form action="/admin/products" className="pvrd-card grid min-w-0 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="grid min-w-0 gap-1.5 xl:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <Input name="q" defaultValue={filters.q} placeholder="Name, SKU, description, finish, size" />
        </label>
        <Select name="categoryId" label="Category" value={filters.categoryId} options={categories.map((category) => ({ value: category.id, label: category.name }))} />
        <Select name="brandId" label="Brand" value={filters.brandId} options={brands.map((brand) => ({ value: brand.id, label: brand.name }))} />
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select name="status" defaultValue={filters.status ?? "all"} className="pvrd-select">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground" title="Lowest trade price to include">Min trade price</span>
          <Input name="minPrice" type="number" min="0" defaultValue={filters.minPrice} />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted-foreground" title="Highest trade price to include">Max trade price</span>
          <Input name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice} />
        </label>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <Button type="submit" className="flex-1">Search</Button>
          <Button variant="outline" render={<Link href="/admin/products" />}>Reset</Button>
        </div>
      </form>

      <div className="flex justify-end">
        <Button render={<Link href="/admin/products/new" />}>
          <Plus data-icon="inline-start" />
          Add Product
        </Button>
      </div>
      <ProductListForm>
      <div className="pvrd-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <select name="bulk" aria-label="Action for selected products" defaultValue="hidden" className="pvrd-select">
            <option value="hidden">Hide selected</option>
            <option value="inactive">Mark inactive</option>
            <option value="active">Mark active</option>
            <option value="delete">Delete selected</option>
          </select>
          <Button type="submit" variant="outline">Apply</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3"><SelectAll /></th>
                <SortHeader label="Product" column="name" sort={sort} dir={dir} filters={filters} />
                <SortHeader label="SKU" column="sku" sort={sort} dir={dir} filters={filters} />
                <SortHeader label="Category" column="category" sort={sort} dir={dir} filters={filters} />
                <SortHeader label="Brand" column="brand" sort={sort} dir={dir} filters={filters} />
                <SortHeader label="MRP" column="mrp" sort={sort} dir={dir} filters={filters} title="Public retail price, shown to everyone" />
                <SortHeader label="Trade price" column="price" sort={sort} dir={dir} filters={filters} title="Dealer rate for retailers and carpenters" />
                <SortHeader label="Status" column="status" sort={sort} dir={dir} filters={filters} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id} className="pvrd-row">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="pvrd-check" name="ids" value={product.id} aria-label={`Select ${product.name}`} />
                  </td>
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
                    <Button type="submit" variant="ghost" size="sm" form={`delete-${product.id}`}>Delete</Button>
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
      </ProductListForm>
      {items.map((product) => (
        <ConfirmForm key={product.id} id={`delete-${product.id}`} action={deleteProduct} message={`Delete ${product.name}? This cannot be undone.`}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="stay" value="1" />
        </ConfirmForm>
      ))}
    </div>
  );
}

function RankList({ title, rows, empty }: { title: string; rows: { label: string; value: string }[]; empty: string }) {
  return (
    <div className="pvrd-card p-4">
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">{empty}</p> : (
        <ol className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SortHeader({
  label,
  column,
  sort,
  dir,
  filters,
  title,
}: {
  label: string;
  column: string;
  sort: string;
  dir: string;
  filters: Record<string, string | undefined>;
  title?: string;
}) {
  const nextDir = sort === column && dir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "sort" && key !== "dir") params.set(key, value);
  }
  params.set("sort", column);
  params.set("dir", nextDir);
  const mark = sort === column ? (dir === "asc" ? " ↑" : " ↓") : "";
  return (
    <th className="px-4 py-3 font-medium">
      <Link href={`/admin/products?${params.toString()}`} title={title} className="hover:text-primary">{label}{mark}</Link>
    </th>
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
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="pvrd-select">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
