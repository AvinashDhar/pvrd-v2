"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToQuotationBucket } from "@/lib/actions/user-quotations";

export function AddToQuotation({
  productId,
  options,
  returnTo,
}: {
  productId: string;
  options: { id: string; label: string }[];
  returnTo: string;
}) {
  const [state, action, pending] = useActionState(addToQuotationBucket, null);

  return (
    <div className="mt-6 grid gap-3">
      <ActionForm action={action} state={state} className="pvrd-card grid gap-3 p-5">
        <p className="pvrd-kicker">Request a quotation</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add this product with a quantity. When the list is ready, request the quotation and discuss it with OM PVRD.
        </p>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="next" value={returnTo} />
        {options.length ? (
          <div className="grid gap-1.5">
            <Label htmlFor="variantId">Finish and size</Label>
            <select
              id="variantId"
              name="variantId"
              defaultValue={options[0]?.id}
              className="pvrd-select bg-transparent"
              {...invalidProps(state, "variantId")}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldIssue state={state} name="variantId" />
          </div>
        ) : null}
        <div className="grid max-w-40 gap-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            defaultValue={1}
            required
            {...invalidProps(state, "quantity")}
          />
          <FieldIssue state={state} name="quantity" />
        </div>
        <FormBanner state={state} />
        <Button type="submit" disabled={pending} size="lg" className="h-12 w-full sm:w-auto">
          {pending ? "Adding…" : "Add to quotation"}
        </Button>
      </ActionForm>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button render={<Link href="/quotations/bucket" />} variant="outline" size="lg" className="h-12">
          Request quotation
        </Button>
        <Button render={<Link href="/quotations" />} variant="outline" size="lg" className="h-12">
          Discuss with OM PVRD
        </Button>
      </div>
    </div>
  );
}
