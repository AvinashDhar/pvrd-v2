import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/catalogue/page-hero";
import { removeBucketLine, requestUserQuotation, updateBucketQuantity } from "@/lib/actions/user-quotations";
import { getUserSession } from "@/lib/auth/session";
import { formatINR } from "@/lib/format";
import { isTradeAccount } from "@/lib/pricing";
import { listBucket } from "@/lib/quotations/service";

export default async function QuotationBucketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string }>;
}) {
  const account = await getUserSession();
  if (!account) redirect("/login?next=/quotations/bucket");
  const { error, added } = await searchParams;
  const bucket = await listBucket(account.id, isTradeAccount(account.userType));

  return (
    <main className="pvrd-page">
      <PageHero
        eyebrow="Your account"
        title="Request a quotation"
        description="Check the sizes and quantities, add a note for the counter, then send the list. OM PVRD replies on the quotation."
        actions={
          <Button render={<Link href="/quotations" />} variant="outline" size="lg" className="h-12">
            Discuss with OM PVRD
          </Button>
        }
      />
      {added === "1" ? <p className="mt-6 text-sm text-[#5f7a18]">Added to your quotation bucket.</p> : null}
      {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}
      {bucket.items.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">Nothing is in the bucket yet. Open a product and add a size with a quantity.</p>
          <Button render={<Link href="/products" />} className="mt-4" size="lg">
            Browse products
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {bucket.items.map((item) => {
            const option = [item.size, item.finish].filter(Boolean).join(" · ");
            return (
              <article key={item.id} className="pvrd-card grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary">{item.name}</h2>
                    {option ? <p className="text-sm text-muted-foreground">{option}</p> : null}
                    {!item.available ? <p className="mt-1 text-sm text-destructive">This product is no longer listed. Remove it before requesting.</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(item.tradePrice || item.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">Trade</p>
                    <p className="mt-1 font-semibold">{formatINR(item.mrp || item.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">MRP</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <form action={updateBucketQuantity} className="flex items-end gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <label className="grid gap-1 text-sm">
                      Quantity
                      <Input name="quantity" type="number" min={1} max={999} defaultValue={item.quantity} className="w-24" />
                    </label>
                    <Button type="submit" variant="outline">
                      Update
                    </Button>
                  </form>
                  <form action={removeBucketLine}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button type="submit" variant="outline">
                      Remove
                    </Button>
                  </form>
                </div>
              </article>
            );
          })}
          <form action={requestUserQuotation} className="pvrd-card grid gap-3 p-4">
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="note">
              Note for OM PVRD
              <Textarea id="note" name="note" maxLength={500} placeholder="Site, delivery town, or anything the counter should know" />
            </label>
            <Button type="submit" size="lg" className="h-12 w-full sm:w-auto">
              Request quotation
            </Button>
          </form>
        </div>
      )}
    </main>
  );
}
