"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldListEditor } from "@/components/admin/field-list-editor";
import { saveCategory } from "@/lib/actions/categories";
import { starterFields } from "@/lib/catalogue/fields";
import type { CategoryField } from "@/lib/categories/field-schemas";

export function CategoryForm({
  category,
}: {
  category?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    imageUrl: string | null;
    displayFormula?: string;
    fields: CategoryField[];
    variantFields: CategoryField[];
  };
}) {
  const [state, action, pending] = useActionState(saveCategory, null);

  return (
    <form action={action} className="pvrd-card max-w-4xl space-y-5 p-4 sm:p-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <Label>Category name</Label>
          <Input name="name" defaultValue={category?.name} required />
        </label>
        <label className="grid gap-1.5">
          <Label>Status</Label>
          <select name="status" defaultValue={category?.status ?? "active"} className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm">
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1.5">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={category?.description ?? ""} />
      </label>
      <label className="grid gap-1.5">
        <Label>Display formula</Label>
        <Input name="displayFormula" defaultValue={category?.displayFormula ?? ""} placeholder="Rod Length × Rod Diameter × Plate Thickness" />
      </label>
      <label className="grid gap-1.5">
        <Label>{category ? "Replace image" : "Category image"}</Label>
        <Input name="image" type="file" accept="image/png,image/jpeg,image/webp" required={!category?.imageUrl} />
        <span className="text-xs text-muted-foreground">Only a file you choose here is stored. Catalogue photos already on the server are left where they are.</span>
        {category?.imageUrl ? <img src={category.imageUrl} alt="" className="mt-2 h-24 w-auto rounded-lg border border-border object-contain" /> : null}
      </label>
      <FieldListEditor name="fields" title="Product fields" initial={category?.fields ?? starterFields} />
      <FieldListEditor name="variantFields" title="Variant fields" initial={category?.variantFields ?? []} />
      <p className="text-xs text-muted-foreground">
        New fields show empty on existing products. Removed fields disappear from the form, and saved values stay in the database until a product is edited.
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : category ? "Save category" : "Create category"}</Button>
      </div>
    </form>
  );
}
