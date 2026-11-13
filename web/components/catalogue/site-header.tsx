"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PvrdLogo } from "@/components/admin/logo";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/brands", label: "Brands" },
  { href: "/catalogues", label: "Catalogues" },
];

function SearchField({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  return (
    <form action="/products" method="get" className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        autoFocus={autoFocus}
        placeholder="Search aldrops, handles, locks…"
        className="h-10 w-full rounded-full border border-[#003c6c]/12 bg-white pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-lime focus:ring-3 focus:ring-lime/30"
      />
    </form>
  );
}

export function SiteHeader({ accountName }: { accountName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[#003c6c]/8 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0">
          <PvrdLogo inverted size={44} />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-primary lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  active ? "bg-secondary text-primary" : "hover:bg-muted hover:text-[#7FA82E]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
          <SearchField className="hidden min-w-0 max-w-sm flex-1 md:block" />
          {accountName ? (
            <Button render={<Link href="/account" />} className="hidden sm:inline-flex">
              {accountName.split(" ")[0]}
            </Button>
          ) : (
            <>
              <Button render={<Link href="/signup" />} variant="outline" className="hidden sm:inline-flex">
                Sign up
              </Button>
              <Button render={<Link href="/login" />} className="hidden sm:inline-flex">
                Sign in
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-black/6 bg-white text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>
      <div className="border-t border-[#003c6c]/6 px-4 py-2 md:hidden">
        <SearchField />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(280px,100%)] gap-0 p-0" showCloseButton>
          <div className="flex h-full flex-col bg-white">
            <div className="border-b border-[#003c6c]/8 px-5 py-4">
              <PvrdLogo inverted size={40} />
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="grid gap-2 p-4">
              {accountName ? (
                <Button render={<Link href="/account" onClick={() => setOpen(false)} />} className="w-full">
                  {accountName.split(" ")[0]}
                </Button>
              ) : (
                <>
                  <Button render={<Link href="/login" onClick={() => setOpen(false)} />} className="w-full">
                    Sign in
                  </Button>
                  <Button
                    render={<Link href="/signup" onClick={() => setOpen(false)} />}
                    variant="outline"
                    className="w-full"
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
