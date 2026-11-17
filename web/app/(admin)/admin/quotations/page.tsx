import Link from "next/link";
import { count, sql } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { AttentionDot, QuotationAttentionMark } from "@/components/admin/quotation-attention";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roleLabel } from "@/lib/auth/access";
import { db } from "@/lib/db";
import { quotations, quotationOutcomes, quotationStatuses } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { listAdminQuotations } from "@/lib/quotations/service";
import { cn } from "@/lib/utils";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; outcome?: string }>;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const status = quotationStatuses.find((item) => item === filters.status);
  const outcome = quotationOutcomes.find((item) => item === filters.outcome);
  const [rows, totals] = await Promise.all([
    listAdminQuotations({ q }),
    db
      .select({
        total: count(),
        open: sql<number>`sum(case when ${quotations.status} = 'open' then 1 else 0 end)`,
        accepted: sql<number>`sum(case when ${quotations.outcome} = 'accepted' then 1 else 0 end)`,
        closed: sql<number>`sum(case when ${quotations.status} = 'closed' then 1 else 0 end)`,
      })
      .from(quotations),
  ]);
  const summary = totals[0];
  const urgent = rows.filter((row) => row.attention);
  const listed = rows.filter((row) => (status ? row.status === status : true) && (outcome ? row.outcome === outcome : true));

  return (
    <div className="space-y-5">
      {urgent.length > 0 ? (
        <section className="rounded-2xl bg-[#fff8e8] p-4 ring-1 ring-[#f0d48a]">
          <div className="mb-3 flex items-center gap-2">
            <AttentionDot />
            <h2 className="font-heading text-base font-semibold text-[#6b4a00]">Handle these first</h2>
            <span className="text-sm font-medium text-[#8a5a00]">{urgent.length}</span>
          </div>
          <p className="mb-3 text-sm text-[#8a5a00]">
            Only open quotations still waiting on your reply. New requests come first, then ones where the customer wrote after your last answer. A reply or a decision takes them off this list.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {urgent.map((row) => (
              <Link key={row.id} href={`/admin/quotations/${row.id}`} className="pvrd-card flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-primary">{row.reference}</span>
                  {row.attention ? <QuotationAttentionMark attention={row.attention} /> : null}
                </div>
                <p className="text-sm">{row.userName}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{row.summary || "No products"}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quotations" value={asNumber(summary?.total)} icon={ClipboardList} tone="blue" />
        <StatCard label="Opened" value={asNumber(summary?.open)} icon={ClipboardList} tone="orange" />
        <StatCard label="Accepted" value={asNumber(summary?.accepted)} icon={ClipboardList} tone="green" />
        <StatCard label="Closed" value={asNumber(summary?.closed)} icon={ClipboardList} tone="purple" />
      </section>

      <form className="flex min-w-0 flex-wrap items-center gap-2" action="/admin/quotations">
        <Input name="q" aria-label="Search by user or reference" defaultValue={q} placeholder="User name, mobile, or Q- reference" className="w-full min-w-0 sm:w-72" />
        <select name="status" aria-label="Opened or closed" defaultValue={status ?? ""} className="pvrd-select sm:w-auto sm:shrink-0">
          <option value="">Opened and closed</option>
          <option value="open">Opened</option>
          <option value="closed">Closed</option>
        </select>
        <select name="outcome" aria-label="Decision" defaultValue={outcome ?? ""} className="pvrd-select sm:w-auto sm:shrink-0">
          <option value="">Any decision</option>
          {quotationOutcomes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {listed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotations match this filter.</p>
      ) : (
        <div className="pvrd-card overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                {["Reference", "User", "Products", "Decision", "State", "Updated"].map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listed.map((row) => (
                <tr key={row.id} className={cn("pvrd-row", row.attention && "bg-[#fff8e8] shadow-[inset_3px_0_0_#e0a106]")}>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/quotations/${row.id}`} className="text-primary hover:underline">
                        {row.reference}
                      </Link>
                      {row.attention ? <QuotationAttentionMark attention={row.attention} /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p>{row.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.mobile} · {roleLabel(row.userType)}
                    </p>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="line-clamp-2" title={row.summary || undefined}>
                      {row.summary || "No products"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={row.outcome} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={row.status === "open" ? "open" : "closed"} />
                  </td>
                  <td className="px-4 py-3">{formatDateTime(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
