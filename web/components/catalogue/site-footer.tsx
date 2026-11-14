import Link from "next/link";
import { PvrdLogo } from "@/components/admin/logo";
import { getCompanySettings } from "@/lib/db/company";

const links = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/brands", label: "Brands" },
  { href: "/catalogues", label: "Catalogues" },
];

export async function SiteFooter() {
  const settings = await getCompanySettings();
  return (
    <footer className="mt-auto border-t border-[#003c6c]/8 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <PvrdLogo inverted size={44} />
          <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
            {settings.tagline} for retailers, contractors and homeowners. Browse fittings, download PDFs and send inquiries in minutes.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Explore</p>
          <ul className="mt-3 text-base">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Contact</p>
          <ul className="mt-3 text-base text-muted-foreground">
            <li>Om Plywood Emporium</li>
            {settings.address ? (
              <li>
                <a
                  href="https://share.google/W15llBup8C0t9R62u"
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center py-2 transition-colors hover:text-primary"
                >
                  {settings.address}
                </a>
              </li>
            ) : null}
            {settings.phone ? (
              <li>
                <a href={`tel:+91${settings.phone.replace(/\D/g, "").replace(/^0/, "")}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                  {settings.phone}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-[#003c6c]/8">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
