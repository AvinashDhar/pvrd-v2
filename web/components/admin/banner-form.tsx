"use client";

import { useState } from "react";
import { useActionState } from "react";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { NumberInput } from "@/components/number-input";
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
    <ActionForm action={action} state={state} className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}
      <FormBanner state={state} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <Label>Banner type</Label>
          <select
            name="type"
            value={type}
            onChange={(event) => {
              const next = event.target.value;
              setType(next);
              if (next === "category") setLinkType("category");
            }}
            className="pvrd-select"
            {...invalidProps(state, "type")}
          >
            <option value="homepage">Homepage</option>
            <option value="category">Category</option>
            <option value="promotional">Promotional</option>
          </select>
          <FieldIssue state={state} name="type" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <Label>Status</Label>
          <select name="status" defaultValue={banner?.status === "inactive" ? "inactive" : "active"} className="pvrd-select" {...invalidProps(state, "status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <FieldIssue state={state} name="status" />
        </label>
      </div>
      <label className="grid gap-1.5">
        <Label>Title</Label>
        <Input name="title" defaultValue={banner?.title} required maxLength={200} {...invalidProps(state, "title")} />
        <FieldIssue state={state} name="title" />
      </label>
      <label className="grid gap-1.5">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={banner?.description ?? ""} required maxLength={2000} {...invalidProps(state, "description")} />
        <FieldIssue state={state} name="description" />
      </label>
      <label className="grid gap-1.5">
        <Label>{banner ? "Replace image" : "Banner image"}</Label>
        <Input name="image" type="file" accept="image/png,image/jpeg,image/webp" required={!banner?.imageUrl} {...invalidProps(state, "image")} />
        <FieldIssue state={state} name="image" />
        <span className="text-xs text-muted-foreground">One new image is stored. Catalogue product photos stay on this server and are not uploaded.</span>
        {banner?.imageUrl ? <img src={banner.imageUrl} alt="" className="mt-2 h-24 w-auto rounded-lg border border-border object-contain" /> : null}
      </label>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <Label>Links to</Label>
          <select
            name="linkType"
            value={type === "category" ? "category" : linkType}
            onChange={(event) => setLinkType(event.target.value)}
            className="pvrd-select"
            {...invalidProps(state, "linkType")}
          >
            {type === "category" ? null : <option value="none">Redirect link only</option>}
            <option value="category">Category</option>
            {type === "category" ? null : <option value="product">Product</option>}
            {type === "category" ? null : <option value="brand">Brand</option>}
            {type === "category" ? null : <option value="offer">Offer</option>}
          </select>
          <FieldIssue state={state} name="linkType" />
        </label>
        {type === "category" || linkType !== "none" ? (
          <label className="grid min-w-0 gap-1.5">
            <Label>{type === "category" ? "Category" : "Linked item"}</Label>
            <select name="linkId" defaultValue={banner?.linkId ?? ""} required className="pvrd-select" {...invalidProps(state, "linkId")}>
              <option value="">Choose</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <FieldIssue state={state} name="linkId" />
          </label>
        ) : (
          <input type="hidden" name="linkId" value="" />
        )}
      </div>
      <label className="grid gap-1.5">
        <Label>Redirect link {type === "promotional" ? "" : "(optional)"}</Label>
        <Input name="redirectUrl" defaultValue={banner?.redirectUrl ?? ""} maxLength={500} placeholder="/products or https://…" {...invalidProps(state, "redirectUrl")} />
        <FieldIssue state={state} name="redirectUrl" />
      </label>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <label className="grid min-w-0 gap-1.5">
          <Label>Start date{datesRequired ? "" : " (optional)"}</Label>
          <Input name="startAt" type="date" defaultValue={dateInput(banner?.startAt)} required={datesRequired} {...invalidProps(state, "startAt")} />
          <FieldIssue state={state} name="startAt" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <Label>End date{datesRequired ? "" : " (optional)"}</Label>
          <Input name="endAt" type="date" defaultValue={dateInput(banner?.endAt)} required={datesRequired} {...invalidProps(state, "endAt")} />
          <FieldIssue state={state} name="endAt" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <Label>Display order</Label>
          <NumberInput name="sortOrder" integer min={0} max={9999} step={1} defaultValue={banner?.sortOrder ?? 0} {...invalidProps(state, "sortOrder")} />
          <FieldIssue state={state} name="sortOrder" />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="notify" className="mt-1" />
        <span>Create a draft notification with this banner. The same image is reused, so nothing extra is uploaded.</span>
      </label>
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
