"use client";

import { useActionState, useState } from "react";
import { ActionForm, FormBanner, FormField } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldListEditor } from "@/components/admin/field-list-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveCategory } from "@/lib/actions/categories";
import { starterFields } from "@/lib/catalogue/fields";
import type { CategoryField, DisplayRate } from "@/lib/categories/field-schemas";

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
    displayRates?: DisplayRate[];
    fields: CategoryField[];
    variantFields: CategoryField[];
  };
}) {
  const [state, action, pending] = useActionState(saveCategory, null);
  const [removed, setRemoved] = useState(false);
  const [rates, setRates] = useState<DisplayRate[]>(category?.displayRates ?? []);

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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Display rates</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRates((current) => [...current, { label: "Display rate", formula: "", keys: [] }])}
          >
            Add rate
          </Button>
        </div>
        <input type="hidden" name="displayRates" value={JSON.stringify(rates)} />
        {rates.length === 0 ? (
          <p className="text-xs text-muted-foreground">No display rate. Add one when a size should be shown as a calculated measurement.</p>
        ) : (
          rates.map((rate, index) => (
            <div
              key={`${rate.label}-${index}`}
              className="grid gap-2 rounded-xl bg-muted/50 p-3 sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_auto]"
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                if (!(event.target instanceof HTMLInputElement)) return;
                event.preventDefault();
                const items = [...event.currentTarget.querySelectorAll<HTMLElement>("input, button")].filter((item) => !item.hasAttribute("disabled"));
                const next = items[items.indexOf(event.target) + 1];
                next?.focus();
              }}
            >
              <Input
                value={rate.label}
                aria-label="Display rate label"
                onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))}
              />
              <Input
                value={rate.formula}
                aria-label="Display rate formula"
                placeholder="Rod Length × Rod Diameter × Plate Thickness"
                onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, formula: event.target.value } : item))}
              />
              <Button type="button" variant="outline" onClick={() => setRates((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
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
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : category ? "Save category" : "Create category"}</Button>
      </div>
    </ActionForm>
  );
}
