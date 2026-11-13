import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/catalogue/site-footer";
import { SiteHeader } from "@/components/catalogue/site-header";
import { getUserSession } from "@/lib/auth/session";
import { listOfferRows, offerIsCurrent } from "@/lib/records";

export async function SiteShell({ children }: { children: ReactNode }) {
  const [account, offers] = await Promise.all([getUserSession(), listOfferRows()]);
  const offer = offers.find(offerIsCurrent);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <p className="bg-primary px-4 py-2 text-center text-[12px] font-medium tracking-wide text-white">
        {offer ? (
          <>
            {offer.name}.{" "}
            <Link href="/products" className="underline decoration-lime underline-offset-2">
              Browse the range
            </Link>
          </>
        ) : (
          <>
            OM PVRD hardware catalogue.{" "}
            <Link href="/products" className="underline decoration-lime underline-offset-2">
              Browse the range
            </Link>
          </>
        )}
        {" · "}
        <Link href={account ? "/account" : "/login"} className="text-lime">
          {account ? "Your account" : "Sign in for trade price"}
        </Link>
      </p>
      <SiteHeader accountName={account?.name} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
