import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Layers3,
  Award,
  Users,
  Star,
  BookOpen,
  ImageIcon,
  Bell,
  Sparkles,
  Coins,
  MessageSquare,
  ClipboardList,
  Settings,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  upcoming?: boolean;
};

export const nextReleaseMessage = "Coming in the next release";

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Categories", href: "/admin/categories", icon: Layers3 },
  { title: "Brands", href: "/admin/brands", icon: Award },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Reviews", href: "/admin/reviews", icon: Star, upcoming: true },
  { title: "Catalogues", href: "/admin/catalogues", icon: BookOpen },
  { title: "Banners", href: "/admin/banners", icon: ImageIcon },
  { title: "Notifications", href: "/admin/notifications", icon: Bell, upcoming: true },
  { title: "Special Offers", href: "/admin/offers", icon: Sparkles, upcoming: true },
  { title: "Loyalty Points", href: "/admin/loyalty", icon: Coins, upcoming: true },
  { title: "Inquiries", href: "/admin/inquiries", icon: MessageSquare, upcoming: true },
  { title: "Quotations", href: "/admin/quotations", icon: ClipboardList },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export function isUpcomingAdminPath(pathname: string) {
  return adminNav.some((item) => item.upcoming && isNavActive(pathname, item.href));
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
