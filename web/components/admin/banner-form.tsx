"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form action={action} className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <Label>Banner type</Label>
          <select
            name="type"
            value={type}
            onChange={(event) => {
              const next = event.target.value;
              setType(next);
              if (next === "category") setLinkType("category");
            }}
            className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm"
          >
            <option value="homepage">Homepage</option>
            <option value="category">Category</option>
            <option value="promotional">Promotional</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <Label>Status</Label>
          <select name="status" defaultValue={banner?.status === "inactive" ? "inactive" : "active"} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1.5">
        <Label>Title</Label>
        <Input name="title" defaultValue={banner?.title} required />
      </label>
      <label className="grid gap-1.5">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={banner?.description ?? ""} required />
      </label>
      <label className="grid gap-1.5">
        <Label>{banner ? "Replace image" : "Banner image"}</Label>
        <Input name="image" type="file" accept="image/png,image/jpeg,image/webp" required={!banner?.imageUrl} />
        <span className="text-xs text-muted-foreground">One new image is stored. Catalogue product photos stay on this server and are not uploaded.</span>
        {banner?.imageUrl ? <img src={banner.imageUrl} alt="" className="mt-2 h-24 w-auto rounded-lg border border-border object-contain" /> : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <Label>Links to</Label>
          <select
            name="linkType"
            value={type === "category" ? "category" : linkType}
            onChange={(event) => setLinkType(event.target.value)}
            className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm"
          >
            {type === "category" ? null : <option value="none">Redirect link only</option>}
            <option value="category">Category</option>
            {type === "category" ? null : <option value="product">Product</option>}
            {type === "category" ? null : <option value="brand">Brand</option>}
            {type === "category" ? null : <option value="offer">Offer</option>}
          </select>
        </label>
        {type === "category" || linkType !== "none" ? (
          <label className="grid gap-1.5">
            <Label>{type === "category" ? "Category" : "Linked item"}</Label>
            <select name="linkId" defaultValue={banner?.linkId ?? ""} required className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
              <option value="">Choose</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="linkId" value="" />
        )}
      </div>
      <label className="grid gap-1.5">
        <Label>Redirect link {type === "promotional" ? "" : "(optional)"}</Label>
        <Input name="redirectUrl" defaultValue={banner?.redirectUrl ?? ""} placeholder="/products or https://…" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5">
          <Label>Start date{datesRequired ? "" : " (optional)"}</Label>
          <Input name="startAt" type="date" defaultValue={dateInput(banner?.startAt)} required={datesRequired} />
        </label>
        <label className="grid gap-1.5">
          <Label>End date{datesRequired ? "" : " (optional)"}</Label>
          <Input name="endAt" type="date" defaultValue={dateInput(banner?.endAt)} required={datesRequired} />
        </label>
        <label className="grid gap-1.5">
          <Label>Display order</Label>
          <Input name="sortOrder" type="number" defaultValue={banner?.sortOrder ?? 0} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="notify" className="mt-1" />
        <span>Create a draft notification with this banner. The same image is reused, so nothing extra is uploaded.</span>
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : banner ? "Save banner" : "Create banner"}</Button>
      </div>
    </form>
  );
}

function dateInput(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}
