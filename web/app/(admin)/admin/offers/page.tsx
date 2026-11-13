import { Sparkles } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import { listOfferRows } from "@/lib/records";

export default async function OffersPage() {
  const offers = await listOfferRows();
  const active = offers.filter((offer) => offer.status === "active").length;
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Offers" value={offers.length} icon={Sparkles} tone="blue" />
        <StatCard label="Active" value={active} icon={Sparkles} tone="green" />
      </section>
      {offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      ) : (
        <div className="grid gap-3">
          {offers.map((offer) => (
            <article key={offer.id} className="pvrd-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading font-semibold">{offer.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {offer.type} · {offer.scope}
                  {offer.startAt ? ` · ${formatDate(offer.startAt)}` : ""}
                  {offer.endAt ? ` – ${formatDate(offer.endAt)}` : ""}
                </p>
              </div>
              <StatusBadge value={offer.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
