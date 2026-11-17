import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getUserSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { listInbox } from "@/lib/notifications/inbox";
import { markAllNotificationsRead, openNotification } from "@/lib/actions/notifications";
import { PageHero } from "@/components/catalogue/page-hero";
import { MediaImage } from "@/components/catalogue/media-image";
import { PendingSubmit } from "@/components/pending-submit";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage() {
  const account = await getUserSession();
  if (!account) redirect("/login?next=/notifications");
  const items = await listInbox(account);
  const unread = items.filter((item) => !item.read).length;

  return (
    <main className="pvrd-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHero
          eyebrow="Your account"
          title="Notifications"
          description={
            unread
              ? `${unread} unread ${unread === 1 ? "notice" : "notices"}.`
              : "Catalogue notices for this account."
          }
        />
        {unread ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="pvrd-card mt-8 flex items-start gap-3 p-5">
          <Bell className="mt-0.5 size-5 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nothing here yet. A notice is added for every account when a product is published.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <form action={openNotification}>
                <input type="hidden" name="id" value={item.id} />
                <PendingSubmit overlay className="pvrd-card relative flex w-full items-stretch gap-4 p-3 text-left disabled:opacity-80 sm:p-4">
                  {item.imageUrl ? (
                    <MediaImage src={item.imageUrl} alt="" className="size-20 shrink-0 rounded-xl" sizes="80px" />
                  ) : (
                    <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                      <Bell className="size-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 py-1">
                    <span className="flex items-center gap-2">
                      {!item.read ? <span className="size-2 shrink-0 rounded-full bg-lime" aria-hidden /> : null}
                      <span className="truncate font-heading text-base font-semibold text-primary">{item.title}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.message}</span>
                    <span className="mt-2 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {formatDate(item.createdAt)}
                      {item.read ? "" : " · Unread"}
                    </span>
                  </span>
                </PendingSubmit>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
