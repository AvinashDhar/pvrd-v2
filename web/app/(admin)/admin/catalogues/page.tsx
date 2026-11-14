import { CatalogueActions } from "@/components/admin/catalogue-actions";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { MediaImage } from "@/components/catalogue/media-image";
import { formatDateTime } from "@/lib/format";
import { listCatalogueRows } from "@/lib/records";
import { BookOpen } from "lucide-react";

export default async function CataloguesPage() {
  const catalogues = await listCatalogueRows();
  const ready = catalogues.filter((item) => item.pdfUrl).length;
  const activeProducts = catalogues.reduce((sum, item) => sum + item.activeProducts, 0);
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Categories" value={catalogues.length} icon={BookOpen} tone="blue" />
        <StatCard label="PDFs stored" value={ready} icon={BookOpen} tone="green" />
        <StatCard label="Waiting for a PDF" value={catalogues.length - ready} icon={BookOpen} tone="orange" />
        <StatCard label="Active products" value={activeProducts} icon={BookOpen} tone="purple" />
      </section>
      <p className="text-sm text-muted-foreground">
        Generate a print-ready PDF for a category. Regenerating replaces the file with the current active products, including images, sizes, finishes, variants, and features.
      </p>
      {catalogues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid gap-3">
          {catalogues.map((catalogue) => (
            <article key={catalogue.id} className="pvrd-card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex min-w-0 items-center gap-4">
                <MediaImage src={catalogue.image} alt="" className="size-16 shrink-0 rounded-2xl" sizes="64px" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading font-semibold">{catalogue.name}</h3>
                    <StatusBadge value={catalogue.pdfUrl ? catalogue.pdfStatus : "draft"} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {catalogue.activeProducts} active {catalogue.activeProducts === 1 ? "product" : "products"}
                    {catalogue.generatedAt ? ` · Generated ${formatDateTime(catalogue.generatedAt)}` : " · No PDF stored"}
                  </p>
                  {catalogue.pdfStatus === "stale" ? (
                    <p className="mt-1 text-xs text-[#8a7424]">Products changed since this PDF was generated.</p>
                  ) : null}
                </div>
              </div>
              <CatalogueActions
                categoryId={catalogue.id}
                name={catalogue.name}
                activeProducts={catalogue.activeProducts}
                hasPdf={Boolean(catalogue.pdfUrl)}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
