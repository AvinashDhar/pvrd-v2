"use client";

import { useState } from "react";
import { useActionState } from "react";
import { ActionForm, CheckField, FormBanner, FormField } from "@/components/action-form";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveBanner } from "@/lib/actions/banners";

type Option = { id: string; label: string };

export function BannerForm({
  banner,
  categories,
  products,
  brands,
  offers,
}: {
  banner?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    linkType: string;
    linkId: string | null;
    redirectUrl: string | null;
    startAt: Date | null;
    endAt: Date | null;
    status: string;
    sortOrder: number | null;
    imageUrl: string;
  };
  categories: Option[];
  products: Option[];
  brands: Option[];
  offers: Option[];
}) {
  const [state, action, pending] = useActionState(saveBanner, null);
  const [type, setType] = useState(banner?.type ?? "homepage");
  const [linkType, setLinkType] = useState(banner?.type === "category" ? "category" : banner?.linkType ?? "none");

  const options = linkType === "category" ? categories : linkType === "product" ? products : linkType === "brand" ? brands : offers;
  const datesRequired = type === "homepage" || type === "promotional";

  return (
    <ActionForm action={action} state={state} autoComplete="off" className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}
      <FormBanner state={state} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField label="Banner type" name="type" state={state}>
          <select
            name="type"
            value={type}
            onChange={(event) => {
              const next = event.target.value;
              setType(next);
              if (next === "category") setLinkType("category");
            }}
            className="pvrd-select"
          >
            <option value="homepage">Homepage</option>
            <option value="category">Category</option>
            <option value="promotional">Promotional</option>
          </select>
        </FormField>
        <FormField label="Status" name="status" state={state}>
          <select name="status" defaultValue={banner?.status === "inactive" ? "inactive" : "active"} className="pvrd-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </div>
      <FormField label="Title" name="title" state={state} required>
        <Input name="title" defaultValue={banner?.title} maxLength={200} />
      </FormField>
      <FormField label="Description" name="description" state={state} required hint="Enter adds a new line. Press Ctrl+Enter or ⌘+Enter to save.">
        <Textarea name="description" defaultValue={banner?.description ?? ""} maxLength={2000} />
      </FormField>
      <FormField label={banner ? "Replace image" : "Banner image"} name="image" state={state} required={!banner?.imageUrl} hint="One new image is stored. Catalogue product photos stay on this server and are not uploaded.">
        <Input name="image" type="file" accept="image/png,image/jpeg,image/webp" />
      </FormField>
      {banner?.imageUrl ? <img src={banner.imageUrl} alt="" className="h-24 w-auto rounded-lg border border-border object-contain" /> : null}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField
          label="Links to"
          name="linkType"
          state={state}
          hint={linkType === "offer" ? "Offer pages arrive in the next release. This choice is saved for then." : undefined}
        >
          <select
            name="linkType"
            value={type === "category" ? "category" : linkType}
            onChange={(event) => setLinkType(event.target.value)}
            className="pvrd-select"
          >
            {type === "category" ? null : <option value="none">Redirect link only</option>}
            <option value="category">Category</option>
            {type === "category" ? null : <option value="product">Product</option>}
            {type === "category" ? null : <option value="brand">Brand</option>}
            {type === "category" ? null : <option value="offer">Offer (next release)</option>}
          </select>
        </FormField>
        {type === "category" || linkType !== "none" ? (
          <FormField label={type === "category" ? "Category" : "Linked item"} name="linkId" state={state} required>
            <select name="linkId" defaultValue={banner?.linkId ?? ""} className="pvrd-select">
              <option value="">Choose</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </FormField>
        ) : (
          <input type="hidden" name="linkId" value="" />
        )}
      </div>
      <FormField label={type === "promotional" ? "Redirect link" : "Redirect link (optional)"} name="redirectUrl" state={state}>
        <Input name="redirectUrl" defaultValue={banner?.redirectUrl ?? ""} maxLength={500} placeholder="/products or https://…" />
      </FormField>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <FormField label={datesRequired ? "Start date" : "Start date (optional)"} name="startAt" state={state} required={datesRequired}>
          <Input name="startAt" type="date" defaultValue={dateInput(banner?.startAt)} />
        </FormField>
        <FormField label={datesRequired ? "End date" : "End date (optional)"} name="endAt" state={state} required={datesRequired}>
          <Input name="endAt" type="date" defaultValue={dateInput(banner?.endAt)} />
        </FormField>
        <FormField label="Display order" name="sortOrder" state={state}>
          <NumberInput name="sortOrder" integer min={0} max={9999} step={1} defaultValue={banner?.sortOrder ?? 0} />
        </FormField>
      </div>
      <CheckField name="notify">
        Create a draft notification with this banner. The same image is reused, so nothing extra is uploaded.
      </CheckField>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : banner ? "Save banner" : "Create banner"}</Button>
      </div>
    </ActionForm>
  );
}

function dateInput(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}
