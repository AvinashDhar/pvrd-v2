"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { CommandSearch } from "@/components/admin/command-search";
import { logout } from "@/lib/actions/auth";
import type { AdminSearchIndex } from "@/lib/records";

export function AdminHeader({
  title,
  subtitle,
  admin,
  search,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  admin: { name: string; email: string };
  search: AdminSearchIndex;
  onMenu?: () => void;
}) {
  const initials = admin.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#003c6c]/8 bg-[#f3f6f9]/80 px-4 py-3 backdrop-blur-xl md:gap-4 md:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenu}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-black/6 bg-white text-foreground lg:hidden"
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
          className="grid size-10 place-items-center rounded-full border border-black/6 bg-white text-foreground transition-transform hover:scale-105"
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
              <button type="submit" className="text-[11px] font-medium text-primary hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
