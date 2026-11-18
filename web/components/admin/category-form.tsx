"use client";

import { useActionState, useState } from "react";
import { ActionForm, FormBanner, FormField } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldListEditor } from "@/components/admin/field-list-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { SubcategorySection, type SubcategoryRow } from "@/components/admin/subcategory-manager";
import { saveCategory } from "@/lib/actions/categories";
import { starterFields } from "@/lib/catalogue/fields";
import type { CategoryField } from "@/lib/categories/field-schemas";

export function CategoryForm({
  category,
  subcategories = [],
}: {
  category?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    imageUrl: string | null;
    fields: CategoryField[];
    variantFields: CategoryField[];
  };
  subcategories?: SubcategoryRow[];
}) {
  const [state, action, pending] = useActionState(saveCategory, null);
  const [removed, setRemoved] = useState(false);

  return (
    <ActionForm action={action} state={state} autoComplete="off" className="pvrd-card max-w-4xl space-y-5 p-4 sm:p-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <FormBanner state={state} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField label="Category name" name="name" state={state} required>
          <Input name="name" defaultValue={category?.name} maxLength={160} />
        </FormField>
        <FormField label="Status" name="status" state={state}>
          <select name="status" defaultValue={category?.status ?? "active"} className="pvrd-select">
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </FormField>
      </div>
      <FormField label="Description" name="description" state={state} hint="Enter adds a new line. Press Ctrl+Enter or ⌘+Enter to save.">
        <Textarea name="description" defaultValue={category?.description ?? ""} maxLength={2000} />
      </FormField>
      <div className="grid gap-2">
        <ImageDropzone
          name="image"
          required={!category}
          invalid={state?.field === "image"}
          label={category ? "Replace image" : "Category image"}
        />
        {state?.field === "image" && state.error ? <p id="image-error" role="alert" className="text-sm text-destructive">{state.error}</p> : null}
        {removed ? <input type="hidden" name="removeImage" value="1" /> : null}
        {category?.imageUrl && !removed ? (
          <div className="flex items-end gap-3">
            <img src={category.imageUrl} alt="" className="h-24 w-auto rounded-lg border border-border object-contain" />
            <Button type="button" variant="outline" onClick={() => setRemoved(true)}>Remove image</Button>
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <FieldListEditor name="fields" title="Product fields" initial={category?.fields ?? starterFields} />
        {state?.field === "fields" && state.error ? <p id="fields-error" role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      </div>
      <FieldListEditor name="variantFields" title="Variant fields" initial={category?.variantFields ?? []} />
      {state?.field === "variantFields" && state.error ? <p id="variantFields-error" role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Saved products keep their values. New fields start empty on those products and appear for every product added after this save. A field that already has saved values cannot be removed, and its type can change only when those values still fit.
      </p>

      <SubcategorySection
        categoryId={category?.id}
        parentFields={category?.fields ?? starterFields}
        parentVariantFields={category?.variantFields ?? []}
        subcategories={subcategories}
        state={state}
      />

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : category ? "Save category" : "Create category"}
        </Button>
      </div>
    </ActionForm>
  );
}
