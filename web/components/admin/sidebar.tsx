"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { adminNav, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { PvrdLogo } from "@/components/admin/logo";

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="min-w-0 px-5 pt-5 pb-4">
        <PvrdLogo className="min-w-0" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {adminNav.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-lime text-primary shadow-[0_8px_20px_rgba(163,203,70,0.28)]"
                  : "text-sidebar-foreground/80 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-white/55")} />
              <span className="flex-1 truncate">{item.title}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold",
                    active ? "bg-primary/15 text-primary" : "bg-lime text-primary",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 rounded-2xl border border-white/10 bg-white/8 p-3.5">
        <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
          Quick shortcuts
        </p>
        <Link
          href="/admin/products/new"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-white/80 transition-colors hover:bg-white/8 hover:text-white"
        >
          <Plus className="size-3.5 text-lime" />
          Add Product
        </Link>
        <Link
          href="/admin/products"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-white/80 transition-colors hover:bg-white/8 hover:text-white"
        >
          <Search className="size-3.5 text-lime" />
          Search Product
        </Link>
      </div>
    </aside>
  );
}
