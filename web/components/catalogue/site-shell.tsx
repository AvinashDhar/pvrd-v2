import type { ReactNode } from "react";
import { CatalogueSearch } from "@/components/catalogue/catalogue-search";
import { SiteFooter } from "@/components/catalogue/site-footer";
import { SiteHeader } from "@/components/catalogue/site-header";
import { getUserSession } from "@/lib/auth/session";
import { unreadCount } from "@/lib/notifications/inbox";

export async function SiteShell({ children }: { children: ReactNode }) {
  const account = await getUserSession();
  const unread = account ? await unreadCount(account) : 0;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <CatalogueSearch>
        <div className="sticky top-0 z-30">
          <SiteHeader
            account={account ? { name: account.name, photoUrl: account.photoUrl } : null}
            unreadCount={account ? unread : null}
          />
        </div>
        <div className="flex-1">{children}</div>
      </CatalogueSearch>
      <SiteFooter />
    </div>
  );
}
