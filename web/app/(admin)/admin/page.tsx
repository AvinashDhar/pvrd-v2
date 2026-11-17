import Link from "next/link";
import {
  Award,
  BookOpen,
  ClipboardList,
  FolderTree,
  Package,
  Plus,
  Search,
  Users,
  Images,
  Boxes,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { AttentionDot, QuotationAttentionMark } from "@/components/admin/quotation-attention";
import { StatCard } from "@/components/admin/stat-card";
import { Bars } from "@/components/admin/mini-chart";
import { chartColors } from "@/lib/brand";
import { formatDateTime, formatNumber } from "@/lib/format";
import { listAdminQuotations } from "@/lib/quotations/service";
import { dashboardData } from "@/lib/records";

const shortcuts = [
  { href: "/admin/products/new", label: "Add Product", icon: Plus, tone: "text-[#003C6C] bg-[#e8f0f6]" },
  { href: "/admin/products", label: "Edit Product", icon: Boxes, tone: "text-[#7FA82E] bg-[#f3f8e4]" },
  { href: "/admin/products", label: "Delete Product", icon: Trash2, tone: "text-[#c24141] bg-[#fdecec]" },
  { href: "/admin/products/new", label: "Product Variants", icon: FolderTree, tone: "text-[#306084] bg-[#e8f0f6]" },
  { href: "/admin/products/new", label: "Product Images", icon: Images, tone: "text-[#185478] bg-[#e8f0f6]" },
  { href: "/admin/products", label: "Search Product", icon: Search, tone: "text-[#7FA82E] bg-[#f3f8e4]" },
];

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

function MetricRow({ label, value, href, hint }: { label: string; value: number; href: string; hint?: string }) {
  return (
    <Link href={href} className="flex items-baseline justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/70">
      <span className="min-w-0">
        <span className="block text-sm text-muted-foreground">{label}</span>
        {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
      </span>
      <span className="font-heading text-lg font-semibold tabular-nums">{formatNumber(value)}</span>
    </Link>
  );
}

export default async function DashboardPage() {
  const [stats, quotations] = await Promise.all([dashboardData(), listAdminQuotations({})]);
  const urgent = quotations.filter((row) => row.attention);
  const openQuotations = quotations.filter((row) => row.status === "open").length;
  const acceptedQuotations = quotations.filter((row) => row.outcome === "accepted").length;
  const closedQuotations = quotations.filter((row) => row.status === "closed").length;
  const cataloguesWaiting = Math.max(stats.categories - stats.cataloguesGenerated, 0);
  const pendingHint = [
    stats.pendingRetailers ? countLabel(stats.pendingRetailers, "retailer") : "",
    stats.pendingContractors ? countLabel(stats.pendingContractors, "contractor") : "",
    stats.pendingConsumers ? countLabel(stats.pendingConsumers, "consumer") : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-5">
      {urgent.length > 0 ? (
        <section className="rounded-2xl bg-[#fff8e8] p-4 ring-1 ring-[#f0d48a] sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <AttentionDot />
            <h2 className="font-heading text-base font-semibold text-[#6b4a00]">Handle these first</h2>
            <span className="text-sm font-medium text-[#8a5a00]">{urgent.length}</span>
            <Link href="/admin/quotations" className="ml-auto text-xs font-semibold text-[#6b4a00] hover:underline">
              All quotations
            </Link>
          </div>
          <p className="mb-3 text-sm text-[#8a5a00]">Open quotations with no reply from you yet. Ones you have already answered stay off this list.</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {urgent.map((row) => (
              <Link key={row.id} href={`/admin/quotations/${row.id}`} className="pvrd-card flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-primary">{row.reference}</span>
                  {row.attention ? <QuotationAttentionMark attention={row.attention} /> : null}
                </div>
                <p className="text-sm">{row.userName}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{row.summary || "No products"}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={stats.products} icon={Package} tone="blue" delay={0} />
        <StatCard label="Total Categories" value={stats.categories} icon={FolderTree} tone="green" delay={40} />
        <StatCard label="Total Brands" value={stats.brands} icon={Award} tone="purple" delay={80} />
        <StatCard label="Hidden products" value={stats.hiddenProducts} icon={Package} tone="orange" delay={120} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="pvrd-card flex flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold">Accounts</h2>
              <p className="text-xs text-muted-foreground">Retailers, contractors, and consumers</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f3f8e4] text-[#5f7a18]">
              <Users className="size-5" />
            </span>
          </div>
          <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(stats.users)}</p>
          <p className="text-xs text-muted-foreground">Total accounts</p>
          <div className="mt-3">
            <MetricRow label="Retailers" value={stats.retailers} href="/admin/users?type=retailer" />
            <MetricRow label="Contractors" value={stats.contractors} href="/admin/users?type=contractor" />
            <MetricRow label="Consumers" value={stats.consumers} href="/admin/users?type=consumer" />
            <MetricRow
              label="Waiting for approval"
              value={stats.pendingUsers}
              href="/admin/users?status=pending"
              hint={stats.pendingUsers > 0 ? pendingHint : "None waiting"}
            />
          </div>
          <Link href="/admin/users" className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-primary">
            View accounts
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        <div className="pvrd-card flex flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold">Quotations</h2>
              <p className="text-xs text-muted-foreground">Price requests from signed-in accounts</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#e8f0f6] text-[#003C6C]">
              <ClipboardList className="size-5" />
            </span>
          </div>
          <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(quotations.length)}</p>
          <p className="text-xs text-muted-foreground">Total quotations</p>
          <div className="mt-3">
            <MetricRow label="Awaiting your reply" value={urgent.length} href="/admin/quotations" hint={urgent.length > 0 ? "Open, and you have not answered yet" : "Nothing waiting on you"} />
            <MetricRow label="Open" value={openQuotations} href="/admin/quotations?status=open" />
            <MetricRow label="Accepted" value={acceptedQuotations} href="/admin/quotations?outcome=accepted" />
            <MetricRow label="Closed" value={closedQuotations} href="/admin/quotations?status=closed" />
          </div>
          <Link href="/admin/quotations" className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-primary">
            View quotations
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        <div className="pvrd-card flex flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold">Catalogues</h2>
              <p className="text-xs text-muted-foreground">Print-ready PDFs, one per category</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#e8f0f6] text-[#185478]">
              <BookOpen className="size-5" />
            </span>
          </div>
          <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(stats.cataloguesGenerated)}</p>
          <p className="text-xs text-muted-foreground">PDFs generated</p>
          <div className="mt-3">
            <MetricRow label="Waiting for a PDF" value={cataloguesWaiting} href="/admin/catalogues" hint="Categories with no stored file" />
            <MetricRow label="Out of date" value={stats.cataloguesStale} href="/admin/catalogues" hint="Products changed since the PDF was generated" />
            <MetricRow label="Categories" value={stats.categories} href="/admin/categories" />
          </div>
          <Link href="/admin/catalogues" className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-primary">
            Manage catalogues
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="pvrd-card p-4 sm:p-5">
          <h2 className="font-heading text-base font-semibold">Recent activities</h2>
          {stats.activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="mt-4 space-y-3.5">
              {stats.activity.map((activity, index) => (
                <li key={activity.id} className="flex gap-3">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${["bg-[#003C6C]", "bg-[#A3CB46]", "bg-[#306084]", "bg-[#7FA82E]", "bg-[#54789C]", "bg-[#185478]"][index % 6]}`} />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{activity.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="pvrd-card p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-base font-semibold">Top categories</h2>
          {stats.topCategories.some((item) => item.value > 0) ? (
            <Bars
              items={stats.topCategories.map((item, index) => ({
                ...item,
                color: chartColors[index % chartColors.length],
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No products in categories yet.</p>
          )}
        </div>
        <div className="pvrd-card p-4 sm:p-5">
          <h2 className="mb-4 font-heading text-base font-semibold">Top brands</h2>
          {stats.topBrands.some((item) => item.value > 0) ? (
            <Bars
              items={stats.topBrands.map((item, index) => ({
                ...item,
                color: chartColors[index % chartColors.length],
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No products assigned to brands yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {shortcuts.map((item) => (
          <Link key={item.label} href={item.href} className="pvrd-card flex items-center gap-3 p-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
              <item.icon className="size-4" />
            </span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
