import { BookOpen } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { MediaImage } from "@/components/catalogue/media-image";
import { formatDateTime } from "@/lib/format";
import { listCatalogueRows } from "@/lib/records";

export default async function CataloguesPage() {
  const catalogues = await listCatalogueRows();
  const ready = catalogues.filter((item) => item.pdfUrl).length;
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Categories" value={catalogues.length} icon={BookOpen} tone="blue" />
        <StatCard label="PDFs stored" value={ready} icon={BookOpen} tone="green" />
        <StatCard label="Waiting for a PDF" value={catalogues.length - ready} icon={BookOpen} tone="orange" />
        <StatCard label="Products" value={catalogues.reduce((sum, item) => sum + item.products, 0)} icon={BookOpen} tone="purple" />
      </section>
      {catalogues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid gap-3">
          {catalogues.map((catalogue) => (
            <article key={catalogue.id} className="pvrd-card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex items-center gap-4">
                <MediaImage src={catalogue.image} alt="" className="size-16 shrink-0 rounded-2xl" sizes="64px" />
                <div>
                  <h3 className="font-heading font-semibold">{catalogue.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {catalogue.products} products
                    {catalogue.generatedAt ? ` · Generated ${formatDateTime(catalogue.generatedAt)}` : " · No PDF stored"}
                  </p>
                </div>
              </div>
              <StatusBadge value={catalogue.pdfUrl ? catalogue.pdfStatus : "draft"} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
