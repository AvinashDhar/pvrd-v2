import { BarChart3 } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Bars } from "@/components/admin/mini-chart";
import { chartColors } from "@/lib/brand";
import { dashboardData, listCatalogueRows, listReviewRows } from "@/lib/records";

export default async function ReportsPage() {
  const [stats, catalogues, reviews] = await Promise.all([
    dashboardData(),
    listCatalogueRows(),
    listReviewRows(),
  ]);
  const withPdf = catalogues.filter((item) => item.pdfUrl).length;
  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const ranked = catalogues
    .slice()
    .sort((a, b) => b.products - a.products)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={stats.products} icon={BarChart3} tone="blue" />
        <StatCard label="Categories" value={stats.categories} icon={BarChart3} tone="green" />
        <StatCard label="PDFs stored" value={withPdf} icon={BarChart3} tone="purple" />
        <StatCard label="Average rating" value={average} icon={BarChart3} tone="orange" />
      </section>
      <div className="pvrd-card p-4 sm:p-5">
        <h2 className="mb-4 font-heading text-base font-semibold">Products by category</h2>
        {ranked.some((item) => item.products > 0) ? (
          <Bars
            items={ranked.map((item, index) => ({
              label: item.name,
              value: item.products,
              color: chartColors[index % chartColors.length],
            }))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        )}
      </div>
    </div>
  );
}
