import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { bannerStats, bannerTiming, listBanners } from "@/lib/banners/queries";
import { formatDate, formatNumber } from "@/lib/format";

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; from?: string; to?: string }>;
}) {
  const filters = await searchParams;
  const [items, stats] = await Promise.all([listBanners(filters), bannerStats()]);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total banners" value={stats.total} icon={ImageIcon} tone="blue" />
        <StatCard label="Active now" value={stats.active} icon={ImageIcon} tone="green" />
        <StatCard label="Homepage" value={stats.homepage} icon={ImageIcon} tone="purple" />
        <StatCard label="Category" value={stats.category} icon={ImageIcon} tone="orange" />
        <StatCard label="Promotional" value={stats.promotional} icon={ImageIcon} tone="blue" />
        <StatCard label="Views" value={stats.views} icon={ImageIcon} tone="green" />
        <StatCard label="Clicks" value={stats.clicks} icon={ImageIcon} tone="purple" />
      </section>

      <form action="/admin/banners" className="pvrd-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <Input name="q" defaultValue={filters.q} placeholder="Banner title" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <select name="type" defaultValue={filters.type ?? "all"} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
            <option value="all">All types</option>
            <option value="homepage">Homepage</option>
            <option value="category">Category</option>
            <option value="promotional">Promotional</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select name="status" defaultValue={filters.status ?? "all"} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <Input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <Input name="to" type="date" defaultValue={filters.to} />
        </label>
        <div className="flex items-end gap-2 lg:col-span-6">
          <Button type="submit">Search</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/banners" />}>Reset</Button>
          <Button className="ml-auto" nativeButton={false} render={<Link href="/admin/banners/new" />}>
            <Plus data-icon="inline-start" />
            Add banner
          </Button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="pvrd-card p-6 text-sm text-muted-foreground">No banners match this search.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((banner) => (
            <article key={banner.id} className="pvrd-card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex min-w-0 items-center gap-4">
                <img src={banner.imageUrl} alt="" className="h-16 w-28 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h3 className="truncate font-heading font-semibold">{banner.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {banner.type}
                    {banner.linkLabel ? ` · ${banner.linkLabel}` : ""}
                    {" · "}
                    {banner.startAt ? formatDate(banner.startAt) : "No start"} – {banner.endAt ? formatDate(banner.endAt) : "No end"}
                    {" · "}order {banner.sortOrder ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(banner.views)} views · {formatNumber(banner.clicks)} clicks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={bannerTiming(banner)} />
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/banners/${banner.id}`} />}>Edit</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
