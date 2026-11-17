"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { adminNav, isNavActive, nextReleaseMessage } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { PvrdLogo } from "@/components/admin/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AdminSidebar({ onNavigate, awaiting = 0 }: { onNavigate?: () => void; awaiting?: number }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar pl-[env(safe-area-inset-left,0px)] text-sidebar-foreground"
    >
      <div aria-hidden className="h-[env(safe-area-inset-top,0px)] shrink-0" />
      <div className="min-w-0 px-5 pt-5 pb-4">
        <PvrdLogo className="min-w-0" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {adminNav.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          const badge = item.href === "/admin/quotations" && awaiting > 0 ? awaiting : item.badge;
          const alert = item.href === "/admin/quotations" && awaiting > 0;
          const className = cn(
            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all duration-200",
            active
              ? "bg-lime text-primary shadow-[0_8px_20px_rgba(163,203,70,0.28)]"
              : "text-sidebar-foreground/80 hover:bg-white/8 hover:text-white",
            item.upcoming && !active && "text-white/55",
          );
          const body = (
            <>
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : item.upcoming ? "text-white/35" : "text-white/55")} />
              <span className="flex-1 truncate">{item.title}</span>
              {item.upcoming ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    active ? "bg-primary/10 text-primary" : "bg-white/10 text-white/70",
                  )}
                >
                  Soon
                </span>
              ) : null}
              {badge ? (
                <span
                  className={cn(
                    "grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold",
                    alert ? "bg-[#e0a106] text-[#3d2a00]" : active ? "bg-primary/15 text-primary" : "bg-lime text-primary",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </>
          );
          if (!item.upcoming) {
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} className={className}>
                {body}
              </Link>
            );
          }
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={<Link href={item.href} onClick={onNavigate} className={className} aria-label={`${item.title}. ${nextReleaseMessage}`} />}
              >
                {body}
              </TooltipTrigger>
              <TooltipContent side="right">{nextReleaseMessage}</TooltipContent>
            </Tooltip>
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
      <div aria-hidden className="h-[env(safe-area-inset-bottom,0px)] shrink-0" />
    </aside>
  );
}
