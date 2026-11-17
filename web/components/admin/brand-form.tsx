"use client";

import { useActionState } from "react";
import { ActionForm, CheckField, FormBanner, FormField } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <ActionForm action={action} state={state} autoComplete="off" className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6">
      {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
      <FormBanner state={state} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField label="Brand name" name="name" state={state} required>
          <Input name="name" defaultValue={brand?.name} maxLength={160} />
        </FormField>
        <FormField label="Status" name="status" state={state}>
          <select name="status" defaultValue={brand?.status ?? "active"} className="pvrd-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </div>
      <FormField label="Description" name="description" state={state} hint="Enter adds a new line. Press Ctrl+Enter or ⌘+Enter to save.">
        <Textarea name="description" defaultValue={brand?.description ?? ""} maxLength={2000} />
      </FormField>
      <FormField label={brand ? "Replace logo" : "Logo"} name="logo" state={state} required={!brand?.logoUrl}>
        <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
      </FormField>
      {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="h-16 w-auto rounded-lg border border-border object-contain" /> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Categories</legend>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <CheckField key={category.id} name="categoryIds" value={category.id} defaultChecked={brand?.categoryIds.includes(category.id)}>
              {category.name}
            </CheckField>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : brand ? "Save brand" : "Create brand"}</Button>
      </div>
    </ActionForm>
  );
}
