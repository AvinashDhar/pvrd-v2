import { SiteShell } from "@/components/catalogue/site-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
