"use client";

import { useActionState } from "react";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveBrand } from "@/lib/actions/brands";

export function BrandForm({
  brand,
  categories,
}: {
  brand?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    logoUrl: string | null;
    categoryIds: string[];
  };
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveBrand, null);

  return (
    <ActionForm action={action} state={state} className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6">
      {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
      <FormBanner state={state} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <Label>Brand name</Label>
          <Input name="name" defaultValue={brand?.name} required maxLength={160} {...invalidProps(state, "name")} />
          <FieldIssue state={state} name="name" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <Label>Status</Label>
          <select name="status" defaultValue={brand?.status ?? "active"} className="pvrd-select" {...invalidProps(state, "status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <FieldIssue state={state} name="status" />
        </label>
      </div>
      <label className="grid gap-1.5">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={brand?.description ?? ""} maxLength={2000} {...invalidProps(state, "description")} />
        <FieldIssue state={state} name="description" />
      </label>
      <label className="grid gap-1.5">
        <Label>{brand ? "Replace logo" : "Logo"}</Label>
        <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required={!brand?.logoUrl} {...invalidProps(state, "logo")} />
        <FieldIssue state={state} name="logo" />
        {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="mt-2 h-16 w-auto rounded-lg border border-border object-contain" /> : null}
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Categories</legend>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <label key={category.id} className="flex min-w-0 items-center gap-2 text-sm">
              <input type="checkbox" name="categoryIds" value={category.id} defaultChecked={brand?.categoryIds.includes(category.id)} />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : brand ? "Save brand" : "Create brand"}</Button>
      </div>
    </ActionForm>
  );
}
