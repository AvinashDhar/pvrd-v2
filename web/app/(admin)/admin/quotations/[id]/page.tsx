import Link from "next/link";
import { notFound } from "next/navigation";
import { NotifyForm } from "@/components/admin/notify-form";
import { AttentionDot, QuotationAttentionMark } from "@/components/admin/quotation-attention";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { roleLabel } from "@/lib/auth/access";
import { quotationAvailabilities } from "@/lib/db/schema";
import { formatDateTime, formatINR } from "@/lib/format";
import { QuotationError, attentionForMessages, getAdminQuotation } from "@/lib/quotations/service";
import {
  closeQuotationAction,
  commentOnQuotationAction,
  decideQuotationAction,
  reopenQuotationAction,
  updateQuotationItemsAction,
} from "@/lib/actions/quotations";

const availabilityLabel: Record<string, string> = {
  unspecified: "Not set",
  available: "Available",
  limited: "Limited stock",
  unavailable: "Not available",
};

const systemKinds = new Set(["close", "reopen"]);
const bubbleLabel: Record<string, string> = {
  availability: "Availability",
  accept: "Accepted",
  decline: "Declined",
};

function chatDay(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function chatTime(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

function messageBody(kind: string, body: string) {
  if (kind === "availability") return body.replace(/^Availability update:\s*/, "");
  return body;
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let quotation: Awaited<ReturnType<typeof getAdminQuotation>>;
  try {
    quotation = await getAdminQuotation(id);
  } catch (caught) {
    if (caught instanceof QuotationError) notFound();
    throw caught;
  }
  const open = quotation.status === "open";
  const attention = attentionForMessages(quotation.status, quotation.messages);
  const waiting = [...quotation.messages].reverse().find((message) => message.role === "user" && (message.kind === "request" || message.kind === "comment"));
  const total = quotation.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/quotations" className="hover:text-primary">
          Quotations
        </Link>
        <span className="mx-2">/</span>
        {quotation.reference}
      </p>

      {attention ? (
        <section className="rounded-2xl bg-[#fff8e8] px-4 py-4 ring-1 ring-[#f0d48a]">
          <div className="flex flex-wrap items-center gap-2">
            <AttentionDot />
            <h2 className="font-heading text-base font-semibold text-[#6b4a00]">
              {attention === "new" ? "New quotation — reply first" : "Customer is waiting for a reply"}
            </h2>
            <QuotationAttentionMark attention={attention} />
          </div>
          {waiting ? <p className="mt-2 line-clamp-3 text-sm text-[#6b4a00]">{waiting.body}</p> : null}
          <NotifyForm action={commentOnQuotationAction} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="id" value={quotation.id} />
            <Textarea name="body" required minLength={1} maxLength={2000} placeholder="Reply or acknowledge this quotation" aria-label="Reply" className="min-h-11 flex-1 rounded-2xl bg-white" />
            <Button type="submit">Send reply</Button>
          </NotifyForm>
        </section>
      ) : null}

      <section className="pvrd-card flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{quotation.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotation.user.name} · {quotation.user.mobile} · {roleLabel(quotation.user.userType)}
            {quotation.user.city ? ` · ${quotation.user.city}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Opened {formatDateTime(quotation.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={quotation.outcome} />
          <StatusBadge value={quotation.status} />
          <p className="text-sm font-semibold">{formatINR(total)}</p>
        </div>
      </section>

      <NotifyForm action={updateQuotationItemsAction} className="pvrd-card overflow-x-auto">
        <input type="hidden" name="id" value={quotation.id} />
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              {["Product", "Qty", "Rate", "Availability", "Time", "Note"].map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item) => {
              const option = [item.size, item.finish].filter(Boolean).join(" · ");
              return (
                <tr key={item.id} className="pvrd-row align-top">
                  <td className="px-4 py-3">
                    <input type="hidden" name="itemId" value={item.id} />
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[option, item.packing, item.sku].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatINR(item.unitPrice)}
                    <span className="block text-xs text-muted-foreground">{item.priceLabel === "trade" ? "Trade" : "MRP"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select name={`availability-${item.id}`} defaultValue={item.availability} aria-label={`Availability for ${item.name}`} className="pvrd-select" disabled={!open}>
                      {quotationAvailabilities.map((value) => (
                        <option key={value} value={value}>
                          {availabilityLabel[value]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input name={`lead-${item.id}`} defaultValue={item.leadTime ?? ""} placeholder="5 days" aria-label={`Lead time for ${item.name}`} className="h-9 w-28 rounded-lg border border-input px-2 text-sm" disabled={!open} />
                  </td>
                  <td className="px-4 py-3">
                    <input name={`note-${item.id}`} defaultValue={item.itemNote ?? ""} placeholder="In stock at the Bokaro counter" aria-label={`Note for ${item.name}`} className="h-9 w-full min-w-48 rounded-lg border border-input px-2 text-sm" disabled={!open} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {open ? (
          <div className="border-t px-4 py-3">
            <Button type="submit">Save availability</Button>
          </div>
        ) : null}
      </NotifyForm>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Discussion</h2>
        <div className="rounded-2xl bg-muted/70 px-3 py-4 sm:px-5">
          <ol className="flex flex-col gap-3">
            {quotation.messages.length === 0 ? <li className="text-center text-sm text-muted-foreground">No messages yet.</li> : null}
            {(() => {
              let previousDay = "";
              return quotation.messages.map((message) => {
                const day = chatDay(message.createdAt);
                const showDay = Boolean(day && day !== previousDay);
                if (showDay) previousDay = day;
                const time = chatTime(message.createdAt);
                if (systemKinds.has(message.kind)) {
                  return (
                    <li key={message.id} className="flex flex-col items-center gap-3">
                      {showDay ? <p className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">{day}</p> : null}
                      <p className="rounded-full bg-background px-3 py-1 text-center text-xs text-muted-foreground">
                        {message.body}
                        {time ? ` · ${time}` : ""}
                      </p>
                    </li>
                  );
                }
                const mine = message.role === "admin";
                const label = bubbleLabel[message.kind];
                return (
                  <li key={message.id} className="flex flex-col gap-3">
                    {showDay ? <p className="self-center rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">{day}</p> : null}
                    <div className={mine ? "flex max-w-[85%] flex-col items-end gap-1 self-end" : "flex max-w-[85%] flex-col items-start gap-1 self-start"}>
                      <p className="px-1 text-xs text-muted-foreground">{mine ? "OM PVRD" : message.author}</p>
                      <div className={mine ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-primary-foreground" : "rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5"}>
                        {label ? <p className={mine ? "text-[11px] font-semibold tracking-wide text-lime uppercase" : "text-[11px] font-semibold tracking-wide text-primary uppercase"}>{label}</p> : null}
                        <p className="text-sm whitespace-pre-wrap">{messageBody(message.kind, message.body)}</p>
                        {time ? <p className={mine ? "mt-1 text-right text-[11px] text-white/70" : "mt-1 text-right text-[11px] text-muted-foreground"}>{time}</p> : null}
                      </div>
                    </div>
                  </li>
                );
              });
            })()}
          </ol>
          {open ? (
            <NotifyForm action={commentOnQuotationAction} className="mt-4 flex items-end gap-2">
              <input type="hidden" name="id" value={quotation.id} />
              <Textarea name="body" required minLength={1} maxLength={2000} placeholder="Reply to the customer" aria-label="Reply" className="min-h-11 flex-1 rounded-2xl bg-background" />
              <Button type="submit">Send</Button>
            </NotifyForm>
          ) : null}
        </div>
      </section>

      {open ? (
        <div className="max-w-xl space-y-4">
            {quotation.outcome === "pending" ? (
              <NotifyForm action={decideQuotationAction} className="pvrd-card space-y-3 px-4 py-4">
                <input type="hidden" name="id" value={quotation.id} />
                <h2 className="font-medium">Decision</h2>
                <Textarea name="body" required minLength={3} maxLength={2000} placeholder="Say what you are accepting or declining, and any condition" aria-label="Decision comment" />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="outcome" value="accepted">
                    Accept with comment
                  </Button>
                  <Button type="submit" name="outcome" value="declined" variant="outline">
                    Decline
                  </Button>
                </div>
              </NotifyForm>
            ) : null}
            <NotifyForm action={closeQuotationAction}>
              <input type="hidden" name="id" value={quotation.id} />
              <Button type="submit" variant="outline">
                Close quotation
              </Button>
            </NotifyForm>
        </div>
      ) : (
        <NotifyForm action={reopenQuotationAction}>
          <input type="hidden" name="id" value={quotation.id} />
          <Button type="submit" variant="outline">
            Reopen quotation
          </Button>
        </NotifyForm>
      )}
    </div>
  );
}
