import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/catalogue/page-hero";
import { getUserSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { listUserQuotations } from "@/lib/quotations/service";

const outcomeLabel = {
  pending: "Waiting for OM PVRD",
  accepted: "Accepted",
  declined: "Declined",
} as const;

export default async function QuotationsPage() {
  const account = await getUserSession();
  if (!account) redirect("/login?next=/quotations");
  const rows = await listUserQuotations(account.id);

  return (
    <main className="pvrd-page">
      <PageHero
        eyebrow="Your account"
        title="Discuss with OM PVRD"
        description="Open a quotation to reply about quantity, availability, or delivery. Request a new one from the bucket."
        actions={
          <Button render={<Link href="/quotations/bucket" />} size="lg" className="h-12">
            Request quotation
          </Button>
        }
      />
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          You have no quotations yet. Add products to the bucket, then request one.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/quotations/${row.id}`} className="pvrd-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-lg font-semibold text-primary">{row.reference}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.status === "open" ? "Opened" : "Closed"} · {outcomeLabel[row.outcome]} · {row.items} {row.items === 1 ? "item" : "items"}
                  </p>
                  {row.summary ? <p className="mt-1 text-sm text-muted-foreground">{row.summary}</p> : null}
                </div>
                <p className="text-sm text-muted-foreground">{formatDateTime(row.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
