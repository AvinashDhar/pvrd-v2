import Link from "next/link";
import { ArrowRight, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPublicBanners } from "@/lib/banners/queries";
import { publicBrands, publicCategories, publicProducts } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { listOfferRows, offerIsCurrent } from "@/lib/records";
import { SiteShell } from "@/components/catalogue/site-shell";
import { ProductCard } from "@/components/catalogue/product-card";
import { CategoryCard } from "@/components/catalogue/category-card";
import { MediaImage } from "@/components/catalogue/media-image";

export default async function HomePage() {
  const [liveHero, categories, products, brands, offers] = await Promise.all([
    listPublicBanners("homepage").then((rows) => rows[0] ?? null),
    publicCategories(),
    publicProducts(),
    publicBrands(),
    listOfferRows(),
  ]);
  const hero = liveHero
    ? {
        image: liveHero.imageUrl,
        eyebrow: "Featured",
        title: liveHero.title,
        text: liveHero.description?.trim() || "Browse fittings and category catalogues.",
      }
    : {
        image: "/images/hero/showroom.jpg",
        eyebrow: "Catalogue",
        title: "Hardware fittings for every opening",
        text: "Browse the current ranges, then open a category to see products and specifications.",
      };
  const liveOffers = offers.filter(offerIsCurrent);
  const shopCategories = categories.slice(0, 8);
  const featured = products.slice(0, 8);

  return (
    <SiteShell>
      <main>
        <section className="relative isolate overflow-hidden">
          <MediaImage
            src={hero.image}
            alt=""
            priority
            className="min-h-[min(72svh,620px)] w-full"
            sizes="100vw"
            imageClassName="object-[center_40%]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#001F3D]/88 via-[#001F3D]/55 to-[#001F3D]/20" />
          <div className="absolute inset-0 bg-linear-to-t from-[#001F3D]/50 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="page-enter mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-lime uppercase">
                {hero.eyebrow} · OM PVRD
              </p>
              <h1 className="mt-3 max-w-xl font-heading text-[2.1rem] leading-[1.12] font-semibold tracking-tight text-white sm:text-5xl">
                {hero.title}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                {hero.text}
              </p>
              <form action="/products" method="get" className="relative mt-6 max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search fittings…"
                  className="h-12 w-full rounded-full border border-white/15 bg-white/12 pr-4 pl-11 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/60 focus:border-lime focus:ring-3 focus:ring-lime/35"
                />
              </form>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button render={<Link href="/products" />} size="lg" className="h-11 bg-lime px-4 text-primary hover:bg-[#8bb52e]">
                  Shop fittings
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  variant="outline"
                  render={<Link href="/catalogues" />}
                  size="lg"
                  className="h-11 border-white/25 bg-white/8 px-4 text-white hover:bg-white/16 hover:text-white"
                >
                  Download catalogues
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
                <Stat value={String(products.length)} label="Products" />
                <Stat value={String(categories.length)} label="Categories" />
                <Stat value={String(brands.length)} label="Brands" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#003c6c]/8 bg-white/60">
          <div className="pvrd-page !py-12">
            <SectionHeading
              kicker="Collections"
              title="Shop by category"
              href="/categories"
              action="View all"
            />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {shopCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  products={category.products}
                  image={category.image}
                  href={`/products?category=${category.slug}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="pvrd-page !pt-12">
          <SectionHeading
            kicker="Featured"
            title="Ready to specify"
            href="/products"
            action="All products"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {liveOffers.length ? (
          <section className="pvrd-page !pt-4">
            <SectionHeading kicker="This month" title="Public offers" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {liveOffers.map((offer) => (
                <Link key={offer.id} href="/products" className="pvrd-card flex flex-col justify-center p-5 sm:p-6">
                  <p className="pvrd-kicker">{offer.type}</p>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-primary">{offer.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {offer.scope}
                    {offer.startAt ? ` · ${formatDate(offer.startAt)}` : ""}
                    {offer.endAt ? ` – ${formatDate(offer.endAt)}` : ""}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Shop this offer
                    <ArrowRight className="size-4" />
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="pvrd-page">
          <div className="pvrd-card relative overflow-hidden">
            <MediaImage
              src="/images/hero/showroom.jpg"
              alt=""
              className="min-h-[240px] sm:min-h-[280px]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-[#001F3D]/72" />
            <div className="absolute inset-0 flex flex-col justify-center gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="max-w-xl text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-lime">
                  Category PDFs
                </span>
                <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Print-ready catalogues for every range.
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  Share with retailers, keep a copy on site, or attach a link to an inquiry.
                </p>
              </div>
              <Button
                render={<Link href="/catalogues" />}
                size="lg"
                className="h-11 bg-lime px-4 text-primary hover:bg-[#8bb52e]"
              >
                <Download data-icon="inline-start" />
                View catalogues
              </Button>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-xl font-semibold text-white">{value}</p>
      <p className="text-white/65">{label}</p>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  href,
  action,
}: {
  kicker: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="pvrd-kicker">{kicker}</p>
        <h2 className="mt-2 font-heading text-2xl font-semibold text-primary sm:text-3xl">{title}</h2>
      </div>
      {href && action ? (
        <Button variant="ghost" render={<Link href={href} />} className="self-start sm:self-auto">
          {action}
          <ArrowRight data-icon="inline-end" />
        </Button>
      ) : null}
    </div>
  );
}
