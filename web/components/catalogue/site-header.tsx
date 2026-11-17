"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, UserRound } from "lucide-react";
import { PvrdLogo } from "@/components/admin/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CatalogueSearchField } from "@/components/catalogue/catalogue-search";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/brands", label: "Brands" },
  { href: "/catalogues", label: "Catalogues" },
];

function NotificationBell({ count }: { count: number }) {
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";
  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-xl border border-black/6 bg-white text-primary transition-colors hover:bg-secondary"
    >
      <Bell className="size-4" />
      {count > 0 ? (
        <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] leading-4 font-semibold text-primary">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

type HeaderAccount = { name: string; photoUrl: string | null };

function AccountChip({
  account,
  onNavigate,
  className,
}: {
  account: HeaderAccount;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href="/account"
      title={account.name}
      aria-label={`${account.name}, your account`}
      onClick={onNavigate}
      className={cn(
        "inline-flex h-11 min-w-0 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-semibold text-primary transition-colors hover:bg-muted",
        className,
      )}
    >
      <Avatar className="size-8 shrink-0 bg-lime text-primary ring-2 ring-[#003c6c]/10 after:hidden">
        {account.photoUrl ? <AvatarImage src={account.photoUrl} alt="" /> : null}
        <AvatarFallback className="bg-lime text-primary">
          <UserRound className="size-4" aria-hidden />
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{account.name}</span>
    </Link>
  );
}

function SearchField({ className }: { className?: string }) {
  return (
    <CatalogueSearchField
      label="Search the catalogue"
      className={cn("relative", className)}
      iconClassName="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      inputClassName="h-11 w-full rounded-full border border-[#003c6c]/12 bg-white pr-20 pl-10 text-base outline-none placeholder:text-muted-foreground focus:border-lime focus:ring-3 focus:ring-lime/30 md:h-10 md:pr-[4.5rem] md:text-sm"
      buttonClassName="absolute top-1/2 right-1 h-8 -translate-y-1/2 rounded-full px-2.5 text-sm font-semibold text-primary hover:bg-muted"
    />
  );
}

export function SiteHeader({
  account = null,
  unreadCount = null,
}: {
  account?: HeaderAccount | null;
  unreadCount?: number | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = account ? [...nav, { href: "/quotations", label: "Quotations" }] : nav;

  return (
    <header className="z-20 border-b border-[#003c6c]/8 bg-white/85 backdrop-blur-xl">
      <div aria-hidden className="h-[env(safe-area-inset-top,0px)]" />
      <div className="safe-gutter mx-auto flex max-w-6xl items-center gap-3 py-3">
        <Link href="/" className="min-w-0">
          <PvrdLogo inverted size={44} />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-primary lg:flex">
          {links.map((item) => {
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
          {unreadCount !== null ? <NotificationBell count={unreadCount} /> : null}
          {account ? (
            <AccountChip account={account} className="hidden max-w-52 lg:inline-flex" />
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="outline" className="hidden lg:inline-flex">
                Sign in
              </Button>
              <Button render={<Link href="/signup" />} className="hidden lg:inline-flex">
                Sign up
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-xl border border-black/6 bg-white text-foreground transition-colors hover:bg-secondary lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>
      <div className="safe-gutter border-t border-[#003c6c]/6 py-2 md:hidden">
        <SearchField />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(280px,100%)] gap-0 p-0" showCloseButton>
          <div className="flex h-full min-h-0 flex-col bg-white pr-[env(safe-area-inset-right,0px)]">
            <div aria-hidden className="h-[env(safe-area-inset-top,0px)] shrink-0" />
            <div className="border-b border-[#003c6c]/8 px-5 py-4">
              <PvrdLogo inverted size={40} />
            </div>
            {account ? (
              <div className="border-b border-[#003c6c]/8 px-4 py-3">
                <AccountChip account={account} onNavigate={() => setOpen(false)} className="w-full max-w-none" />
              </div>
            ) : null}
            <nav
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4",
                account ? "pb-[max(1rem,env(safe-area-inset-bottom,0px))]" : "",
              )}
            >
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              {unreadCount !== null ? (
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-primary hover:bg-muted"
                >
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Link>
              ) : null}
            </nav>
            {account ? null : (
              <div className="grid gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
                <Button
                  render={<Link href="/login" onClick={() => setOpen(false)} />}
                  variant="outline"
                  className="w-full"
                >
                  Sign in
                </Button>
                <Button render={<Link href="/signup" onClick={() => setOpen(false)} />} className="w-full">
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
