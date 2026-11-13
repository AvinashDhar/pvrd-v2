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
  Settings,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Categories", href: "/admin/categories", icon: Layers3 },
  { title: "Brands", href: "/admin/brands", icon: Award },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Reviews", href: "/admin/reviews", icon: Star },
  { title: "Catalogues", href: "/admin/catalogues", icon: BookOpen },
  { title: "Banners", href: "/admin/banners", icon: ImageIcon },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Special Offers", href: "/admin/offers", icon: Sparkles },
  { title: "Loyalty Points", href: "/admin/loyalty", icon: Coins },
  { title: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
