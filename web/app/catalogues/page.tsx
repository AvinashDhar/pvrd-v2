import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUserSession } from "@/lib/auth/session";
import { GuestOffer } from "@/components/catalogue/account-benefits";
import { PageHero } from "@/components/catalogue/page-hero";
import { MediaImage } from "@/components/catalogue/media-image";
import { listCatalogueRows } from "@/lib/records";

export default async function PublicCataloguesPage() {
  const [rows, account] = await Promise.all([listCatalogueRows(), getUserSession()]);
  const catalogues = rows.filter((item) => item.status === "active");
  return (
    <main className="pvrd-page">
      <PageHero
        title="Catalogues"
        description="Print-ready PDFs for each category. View a range here, or download it to share with retailers and keep on site."
      />
      {account ? null : (
        <div className="mt-5">
          <GuestOffer next="/catalogues" />
        </div>
      )}
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
                  className="size-20 shrink-0 rounded-2xl"
                  sizes="80px"
                />
                <div>
                  <h2 className="font-heading text-lg font-semibold tracking-tight">{catalogue.name}</h2>
                  <p className="mt-0.5 text-base text-muted-foreground">
                    {catalogue.activeProducts} active {catalogue.activeProducts === 1 ? "product" : "products"}
                    {catalogue.pdfUrl ? "" : " · PDF not stored yet"}
                  </p>
                </div>
              </div>
              {catalogue.pdfUrl ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<a href={`/api/catalogues/${catalogue.id}/download?view=1`} target="_blank" rel="noreferrer" />}>
                    View catalogue
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<a href={`/api/catalogues/${catalogue.id}/download`} />}>
                    Download PDF
                  </Button>
                </div>
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
