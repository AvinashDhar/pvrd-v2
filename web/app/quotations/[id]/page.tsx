import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { closeUserQuotation, commentAsUser } from "@/lib/actions/user-quotations";
import { getUserSession } from "@/lib/auth/session";
import { formatINR } from "@/lib/format";
import { QuotationError, getUserQuotation } from "@/lib/quotations/service";

const availability: Record<string, string> = {
  unspecified: "Availability not set",
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

export default async function QuotationDiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const account = await getUserSession();
  const { id } = await params;
  if (!account) redirect(`/login?next=${encodeURIComponent(`/quotations/${id}`)}`);
  const { error } = await searchParams;
  let quotation;
  try {
    quotation = await getUserQuotation(account.id, id);
  } catch (caught) {
    if (caught instanceof QuotationError && caught.status === 404) notFound();
    throw caught;
  }
  const open = quotation.status === "open";
  let previousDay = "";

  return (
    <main className="pvrd-page">
      <p className="text-sm text-muted-foreground">
        <Link href="/quotations" className="hover:text-primary">Quotations</Link>
        <span className="mx-2">/</span>
        <span>{quotation.reference}</span>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary sm:text-3xl">{quotation.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {open ? "Opened" : "Closed"} · {quotation.outcome === "pending" ? "Waiting for OM PVRD" : quotation.outcome === "accepted" ? "Accepted" : "Declined"}
          </p>
        </div>
        {open ? (
          <form action={closeUserQuotation}>
            <input type="hidden" name="id" value={quotation.id} />
            <Button type="submit" variant="outline">
              Close quotation
            </Button>
          </form>
        ) : null}
      </div>

      <ul className="mt-6 grid gap-3">
        {quotation.items.map((line) => {
          const option = [line.size, line.finish].filter(Boolean).join(" · ");
          return (
            <li key={line.id} className="pvrd-card p-4">
              <p className="font-semibold text-primary">{line.name}</p>
              {option ? <p className="text-sm text-muted-foreground">{option}</p> : null}
              <p className="mt-1 text-sm text-muted-foreground">
                {line.quantity} × {formatINR(line.unitPrice)} {line.priceLabel === "trade" ? "trade" : "MRP"}
                {line.packing ? ` · ${line.packing}` : ""}
              </p>
              <p className="mt-1 text-sm">
                {availability[line.availability] ?? "Availability not set"}
                {line.leadTime ? ` · ${line.leadTime}` : ""}
              </p>
              {line.itemNote ? <p className="mt-1 text-sm text-muted-foreground">{line.itemNote}</p> : null}
            </li>
          );
        })}
      </ul>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Discussion with OM PVRD</h2>
        <div className="mt-3 rounded-2xl bg-muted/70 px-3 py-4 sm:px-5">
          <ol className="flex flex-col gap-3">
            {quotation.messages.length === 0 ? <li className="text-center text-sm text-muted-foreground">No messages yet.</li> : null}
            {quotation.messages.map((message) => {
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
              const mine = message.role === "user";
              const label = bubbleLabel[message.kind];
              return (
                <li key={message.id} className="flex flex-col gap-3">
                  {showDay ? <p className="self-center rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">{day}</p> : null}
                  <div className={mine ? "flex max-w-[85%] flex-col items-end gap-1 self-end" : "flex max-w-[85%] flex-col items-start gap-1 self-start"}>
                    <p className="px-1 text-xs text-muted-foreground">{mine ? "You" : "OM PVRD"}</p>
                    <div className={mine ? "rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-primary-foreground" : "rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5"}>
                      {label ? <p className={mine ? "text-[11px] font-semibold tracking-wide text-lime uppercase" : "text-[11px] font-semibold tracking-wide text-primary uppercase"}>{label}</p> : null}
                      <p className="text-sm whitespace-pre-wrap">{messageBody(message.kind, message.body)}</p>
                      {time ? <p className={mine ? "mt-1 text-right text-[11px] text-white/70" : "mt-1 text-right text-[11px] text-muted-foreground"}>{time}</p> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        {open ? (
          <form action={commentAsUser} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={quotation.id} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="body">
              Reply
              <Textarea id="body" name="body" maxLength={2000} required placeholder="Reply about quantity, site, or delivery" />
            </label>
            <Button type="submit" className="w-full sm:w-auto">
              Send
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">This quotation is closed. Request a new one from the bucket when you need another.</p>
        )}
      </section>
    </main>
  );
}
