import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/catalogue/page-hero";
import { MediaImage } from "@/components/catalogue/media-image";
import { listCatalogueRows } from "@/lib/records";

export default async function PublicCataloguesPage() {
  const catalogues = (await listCatalogueRows()).filter((item) => item.status === "active");
  return (
    <main className="pvrd-page">
      <PageHero
        title="Catalogues"
        description="Category ranges in the current catalogue. A download appears here after a PDF is stored for that category."
      />
      {catalogues.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No catalogues yet.</p>
      ) : (
        <div className="mt-8 grid gap-3">
          {catalogues.map((catalogue) => (
            <article
              key={catalogue.id}
              className="pvrd-card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="flex items-center gap-4">
                <MediaImage
                  src={catalogue.image}
                  alt=""
                  className="size-16 shrink-0 rounded-2xl sm:size-20"
                  sizes="80px"
                />
                <div>
                  <h2 className="font-heading font-semibold tracking-tight">{catalogue.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {catalogue.products} products{catalogue.pdfUrl ? "" : " · PDF not stored yet"}
                  </p>
                </div>
              </div>
              {catalogue.pdfUrl ? (
                <Button variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<a href={catalogue.pdfUrl} />}>
                  Download PDF
                </Button>
              ) : (
                <Button variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<Link href={`/products?category=${catalogue.slug}`} />}>
                  Browse products
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
