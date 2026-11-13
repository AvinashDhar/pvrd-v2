"use client";

import { useActionState } from "react";
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
    <form action={action} className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6">
      {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <Label>Brand name</Label>
          <Input name="name" defaultValue={brand?.name} required />
        </label>
        <label className="grid gap-1.5">
          <Label>Status</Label>
          <select name="status" defaultValue={brand?.status ?? "active"} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1.5">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={brand?.description ?? ""} />
      </label>
      <label className="grid gap-1.5">
        <Label>{brand ? "Replace logo" : "Logo"}</Label>
        <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required={!brand?.logoUrl} />
        {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="mt-2 h-16 w-auto rounded-lg border border-border object-contain" /> : null}
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Categories</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="categoryIds" value={category.id} defaultChecked={brand?.categoryIds.includes(category.id)} />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : brand ? "Save brand" : "Create brand"}</Button>
      </div>
    </form>
  );
}
