import Link from "next/link";
import {
  Award,
  FolderTree,
  Package,
  Plus,
  Search,
  Store,
  Users,
  UserRoundCog,
  Images,
  Boxes,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Bars } from "@/components/admin/mini-chart";
import { chartColors } from "@/lib/brand";
import { formatDateTime } from "@/lib/format";
import { dashboardData } from "@/lib/records";

const shortcuts = [
  { href: "/admin/products/new", label: "Add Product", icon: Plus, tone: "text-[#003C6C] bg-[#e8f0f6]" },
  { href: "/admin/products", label: "Edit Product", icon: Boxes, tone: "text-[#7FA82E] bg-[#f3f8e4]" },
  { href: "/admin/products", label: "Delete Product", icon: Trash2, tone: "text-[#c24141] bg-[#fdecec]" },
  { href: "/admin/products/new", label: "Product Variants", icon: FolderTree, tone: "text-[#306084] bg-[#e8f0f6]" },
  { href: "/admin/products/new", label: "Product Images", icon: Images, tone: "text-[#185478] bg-[#e8f0f6]" },
  { href: "/admin/products", label: "Search Product", icon: Search, tone: "text-[#7FA82E] bg-[#f3f8e4]" },
];

export default async function DashboardPage() {
  const stats = await dashboardData();
  const pending = [
    { label: "Users", value: stats.pendingUsers, href: "/admin/users" },
    { label: "Contractors", value: stats.pendingContractors, href: "/admin/users" },
    { label: "Retailers", value: stats.pendingRetailers, href: "/admin/users" },
    { label: "Inquiries", value: stats.pendingInquiries, href: "/admin/inquiries" },
    { label: "Hidden products", value: stats.hiddenProducts, href: "/admin/products" },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Products" value={stats.products} icon={Package} tone="blue" delay={0} />
        <StatCard label="Total Categories" value={stats.categories} icon={FolderTree} tone="green" delay={40} />
        <StatCard label="Total Brands" value={stats.brands} icon={Award} tone="purple" delay={80} />
        <StatCard label="Total Users" value={stats.users} icon={Users} tone="orange" delay={120} />
        <StatCard label="Total Contractors" value={stats.contractors} icon={UserRoundCog} tone="teal" delay={160} />
        <StatCard label="Total Retailers" value={stats.retailers} icon={Store} tone="teal" delay={200} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="pvrd-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-heading text-base font-semibold">Pending approvals</h2>
            <p className="text-xs text-muted-foreground">Items waiting for an admin decision</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {pending.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-2xl bg-muted/70 p-3.5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,44,84,0.08)]"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-heading text-2xl font-semibold">{item.value}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  View all
                  <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </Link>
            ))}
          </div>
        </div>

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
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
