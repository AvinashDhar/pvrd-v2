import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPublicBanners } from "@/lib/banners/queries";
import { getUserSession } from "@/lib/auth/session";
import { featuredPublicProducts, publicBrands, publicCategories, publicProductTotal } from "@/lib/catalogue";
import { isTradeAccount } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { listOfferRows, offerIsCurrent } from "@/lib/records";
import { SiteShell } from "@/components/catalogue/site-shell";
import { ProductCard, productGridClassName } from "@/components/catalogue/product-card";
import { cn } from "@/lib/utils";
import { CategoryCard } from "@/components/catalogue/category-card";
import { MediaImage } from "@/components/catalogue/media-image";
import { BannerCarousel } from "@/components/catalogue/banner-carousel";
import { HeroSearch } from "@/components/catalogue/catalogue-search";
import { NextReleaseFrame } from "@/components/brand/next-release";
import { AccountBenefits } from "@/components/catalogue/account-benefits";

export default async function HomePage() {
  const [homepageBanners, categories, featured, productTotal, brands, offers, account] = await Promise.all([
    listPublicBanners("homepage"),
    publicCategories(),
    featuredPublicProducts(8),
    publicProductTotal(),
    publicBrands(),
    listOfferRows(),
    getUserSession(),
  ]);
  const trade = isTradeAccount(account?.userType);
  const slides = homepageBanners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    image: banner.imageUrl,
    href: banner.redirectUrl?.trim() || "/products",
  }));
  const liveOffers = offers.filter(offerIsCurrent);
  const shopCategories = categories.slice(0, 8);

  return (
    <SiteShell>
      <main>
        <section className={slides.length ? "relative isolate overflow-hidden" : "relative isolate min-h-[min(72svh,620px)] overflow-hidden"}>
          <MediaImage
            src="/images/hero/showroom.jpg"
            alt=""
            priority={slides.length === 0}
            className="absolute inset-0 size-full"
            sizes="100vw"
            imageClassName="object-[center_40%]"
          />
          <div
            className={
              slides.length
                ? "absolute inset-0 bg-linear-to-r from-[#001F3D]/92 via-[#001F3D]/78 to-[#001F3D]/58"
                : "absolute inset-0 bg-linear-to-r from-[#001F3D]/88 via-[#001F3D]/55 to-[#001F3D]/20"
            }
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#001F3D]/50 via-transparent to-transparent" />
          <div
            className={
              slides.length
                ? "safe-gutter relative mx-auto flex w-full max-w-7xl items-center py-8 sm:py-10"
                : "safe-gutter relative mx-auto flex min-h-[min(72svh,620px)] w-full max-w-6xl items-end py-10 sm:items-center sm:py-16"
            }
          >
            <div className={slides.length ? "page-enter grid w-full items-center gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]" : "page-enter w-full max-w-xl"}>
              {slides.length > 0 ? (
                <div className="order-1 min-w-0 lg:order-2">
                  <BannerCarousel banners={slides} variant="panel" />
                </div>
              ) : null}
              <div className={slides.length ? "order-2 min-w-0 lg:order-1" : undefined}>
                <p className="text-[11px] font-semibold tracking-[0.22em] text-lime uppercase">Catalogue · OM PVRD</p>
                <h1 className="mt-3 max-w-xl font-heading text-[2.1rem] leading-[1.12] font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] xl:text-5xl">
                  Hardware fittings for every opening
                </h1>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">
                  Browse the current ranges, then open a category to see products and specifications.
                </p>
                <HeroSearch />
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                  <Stat value={String(productTotal)} label="Products" />
                  <Stat value={String(categories.length)} label="Categories" />
                  <Stat value={String(brands.length)} label="Brands" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {account ? null : (
          <section className="pvrd-page !pb-0">
            <AccountBenefits showActions />
          </section>
        )}

        <section className="border-b border-[#003c6c]/8 bg-white/60">
          <div className="pvrd-page !py-8 sm:!py-12">
            <SectionHeading
              kicker="Collections"
              title="Shop by category"
              href="/categories"
              action="View all"
            />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
          <div className={cn(productGridClassName, "mt-6 lg:grid-cols-4")}>
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} trade={trade} />
            ))}
          </div>
        </section>

        {liveOffers.length ? (
          <section className="pvrd-page !pt-4">
            <NextReleaseFrame title="Public offers">
              <SectionHeading kicker="This month" title="Public offers" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {liveOffers.map((offer) => (
                  <div key={offer.id} className="pvrd-card flex flex-col justify-center p-5 sm:p-6">
                    <p className="pvrd-kicker">{offer.type}</p>
                    <h3 className="mt-2 font-heading text-xl font-semibold text-primary">{offer.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {offer.scope}
                      {offer.startAt ? ` · ${formatDate(offer.startAt)}` : ""}
                      {offer.endAt ? ` – ${formatDate(offer.endAt)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </NextReleaseFrame>
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
        <h2 className="mt-2 font-heading text-xl font-semibold text-primary sm:text-3xl">{title}</h2>
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
