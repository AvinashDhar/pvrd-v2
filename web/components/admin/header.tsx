"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { AttentionDot } from "@/components/admin/quotation-attention";
import { CommandSearch } from "@/components/admin/command-search";
import { PendingSubmit } from "@/components/pending-submit";
import { logout } from "@/lib/actions/auth";
import type { AdminSearchIndex } from "@/lib/records";

export function AdminHeader({
  title,
  subtitle,
  admin,
  search,
  awaiting = 0,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  admin: { name: string; email: string };
  search: AdminSearchIndex;
  awaiting?: number;
  onMenu?: () => void;
}) {
  const initials = admin.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <header className="sticky top-0 z-30 border-b border-[#003c6c]/8 bg-[#f3f6f9]/80 backdrop-blur-xl">
      <div aria-hidden className="h-[env(safe-area-inset-top,0px)]" />
      <div className="safe-gutter py-3">
      <div className="flex items-center gap-3 md:gap-4">
      <button
        type="button"
        onClick={onMenu}
        className="grid size-11 shrink-0 place-items-center rounded-xl border border-black/6 bg-white text-foreground transition-colors hover:bg-secondary lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>

      <div className="min-w-0 flex-1 md:max-w-sm md:flex-none lg:max-w-none">
        <h1 className="truncate font-heading text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
        ) : null}
      </div>

      <div className="ml-auto flex min-w-0 items-center md:ml-0 md:flex-1 md:justify-center">
        <CommandSearch search={search} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/admin/notifications"
          className="grid size-11 place-items-center rounded-full border border-black/6 bg-white text-foreground transition-transform hover:scale-105"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5 rounded-full border border-black/6 bg-white py-1 pr-2 pl-1 sm:pr-3">
          <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
            {initials || "A"}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold">{admin.name}</p>
            <form action={logout} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{admin.email}</span>
              <PendingSubmit className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:opacity-70">
                Sign out
              </PendingSubmit>
            </form>
          </div>
        </div>
      </div>
      </div>
      {awaiting > 0 ? (
        <Link
          href="/admin/quotations"
          className="mt-3 flex items-center gap-2 rounded-xl bg-[#fff4d6] px-3 py-2 text-sm font-medium text-[#6b4a00] ring-1 ring-[#f0d48a]"
        >
          <AttentionDot />
          <span className="min-w-0 flex-1">
            {awaiting === 1 ? "1 open quotation needs a reply" : `${awaiting} open quotations need a reply`}
          </span>
          <span className="text-xs font-semibold">Open</span>
        </Link>
      ) : null}
      </div>
    </header>
  );
}
