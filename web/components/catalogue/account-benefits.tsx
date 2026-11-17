"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function GuestOffer({ next }: { next?: string }) {
  const href = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  return (
    <Link href={href} className="pvrd-card block p-4 text-sm leading-relaxed font-medium text-primary">
      Sign in for the discounted trade price, to request a quotation, and to discuss it with OM PVRD.
    </Link>
  );
}

export const accountBenefits = [
  {
    title: "Discounted trade price",
    detail: "Retailer, carpenter, and contractor accounts see the dealer rate. Guests and consumer accounts see MRP.",
  },
  {
    title: "Request a quotation",
    detail: "After you sign in, add the sizes and quantities you need and send the list to OM PVRD.",
  },
  {
    title: "Discuss with OM PVRD",
    detail: "After you sign in, reply on an open quotation until you or OM PVRD closes it.",
  },
] as const;

export function AccountBenefits({
  showActions = false,
  next,
  title = "Sign in for trade prices and a direct line to OM PVRD",
}: {
  showActions?: boolean;
  next?: string;
  title?: string;
}) {
  const login = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const signup = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  return (
    <section className="pvrd-card p-5 sm:p-6">
      <p className="pvrd-kicker">Why sign in</p>
      <h2 className="mt-2 font-heading text-xl font-semibold text-primary sm:text-2xl">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {accountBenefits.map((item) => (
          <li key={item.title}>
            <p className="font-medium text-primary">{item.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
      {showActions ? (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href={login} />} size="lg" className="h-12 sm:w-auto">
            Sign in
          </Button>
          <Button render={<Link href={signup} />} variant="outline" size="lg" className="h-12 sm:w-auto">
            Create account
          </Button>
        </div>
      ) : null}
    </section>
  );
}
