"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { adminNav, isNavActive } from "@/lib/nav";
import type { AdminSearchIndex } from "@/lib/records";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Dashboard", subtitle: "Welcome back, Admin!" },
  "/admin/products": { title: "Product Management", subtitle: "Create, organise and maintain the catalogue" },
  "/admin/products/new": { title: "Add Product", subtitle: "Dashboard › Products › Add Product" },
  "/admin/categories": { title: "Category Management", subtitle: "Dynamic fields, variants and visibility" },
  "/admin/brands": { title: "Brand Management", subtitle: "Logos, categories and product counts" },
  "/admin/users": { title: "User Management", subtitle: "Retailers, contractors and consumers" },
  "/admin/reviews": { title: "Review Management", subtitle: "Moderate consumer reviews of contractors" },
  "/admin/catalogues": { title: "Catalogue Management", subtitle: "Category ranges and stored PDF files" },
  "/admin/banners": { title: "Banner Management", subtitle: "Homepage, category and promotional creatives" },
  "/admin/notifications": { title: "Notification Management", subtitle: "Schedule and send audience campaigns" },
  "/admin/offers": { title: "Special Offers", subtitle: "Product, category, brand and gift campaigns" },
  "/admin/loyalty": { title: "Loyalty Points", subtitle: "Earn rules, redeem rules and wallets" },
  "/admin/inquiries": { title: "Inquiries", subtitle: "Product questions, catalogue requests and follow-ups" },
  "/admin/settings": { title: "Settings", subtitle: "Company information, contacts and logo" },
  "/admin/reports": { title: "Reports", subtitle: "Views, saves, contractor ratings and downloads" },
};

function resolveMeta(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/admin/products/")) {
    return { title: "Product Details", subtitle: "Dashboard › Products › View" };
  }
  if (pathname === "/admin/banners/new") {
    return { title: "Add Banner", subtitle: "Dashboard › Banners › Add" };
  }
  if (pathname.startsWith("/admin/banners/")) {
    return { title: "Banner Details", subtitle: "Dashboard › Banners › Edit" };
  }
  const match = adminNav.find((item) => isNavActive(pathname, item.href));
  return {
    title: match?.title ?? "Admin",
    subtitle: "OM PVRD Admin Panel",
  };
}

export function AdminShell({
  children,
  admin,
  search,
}: {
  children: React.ReactNode;
  admin: { name: string; email: string };
  search: AdminSearchIndex;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const meta = resolveMeta(pathname);
  const subtitle = pathname === "/admin" ? `Welcome back, ${admin.name}` : meta.subtitle;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 hidden h-screen w-[260px] shrink-0 overflow-hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={meta.title} subtitle={subtitle} admin={admin} search={search} onMenu={() => setOpen(true)} />
        <main className="page-enter min-w-0 flex-1 px-4 py-5 sm:px-5 md:px-6 md:py-6 lg:px-8">{children}</main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[260px] border-0 p-0" showCloseButton={false}>
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
