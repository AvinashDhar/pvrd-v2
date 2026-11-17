"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ActionForm, CheckField, FieldIssue, FieldTip, FormBanner, FormField, RequiredMark } from "@/components/action-form";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveProduct } from "@/lib/actions/products";
import { pricingFieldHelp } from "@/lib/pricing";
import { computeDisplayRate } from "@/lib/catalogue/fields";
import type { CategoryField, DisplayRate } from "@/lib/categories/field-schemas";

const columnKeys = new Set([
  "image",
  "brand",
  "name",
  "sku",
  "mrp",
  "price",
  "contractorDiscount",
  "consumerDiscount",
  "points",
  "description",
]);

type FormCategory = {
  id: string;
  name: string;
  status: string;
  fields: CategoryField[];
  variantFields: CategoryField[];
  displayFormula?: string;
  displayRates?: DisplayRate[];
};

export type FormVariant = {
  id?: string;
  values: Record<string, string>;
  copy: Record<string, boolean>;
  imageUrl?: string | null;
  hasImage?: boolean;
};

export function ProductForm({
  categories,
  brands,
  product,
}: {
  categories: FormCategory[];
  brands: { id: string; name: string }[];
  product?: {
    id: string;
    categoryId: string;
    brandId: string | null;
    name: string;
    sku: string | null;
    mrp: string;
    price: string;
    contractorDiscount: string | null;
    consumerDiscount: string | null;
    points: number | null;
    description: string | null;
    status: string;
    attributes: Record<string, string>;
    images: { id: string; url: string; isPrimary: boolean }[];
    variants: FormVariant[];
  };
}) {
  const formId = useId();
  const imageFocus = useRef<{ id: string; action: "up" | "down" | "remove" | "picker" } | null>(null);
  const variantFocus = useRef<number | "add" | null>(null);
  const [state, action, pending] = useActionState(saveProduct, null);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [mrp, setMrp] = useState(product?.mrp ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [contractorDiscount, setContractorDiscount] = useState(product?.contractorDiscount ?? "");
  const [consumerDiscount, setConsumerDiscount] = useState(product?.consumerDiscount ?? "");
  const [points, setPoints] = useState(String(product?.points ?? 0));
  const [attributes, setAttributes] = useState<Record<string, string>>(product?.attributes ?? {});
  const [images, setImages] = useState(product?.images ?? []);
  const [variants, setVariants] = useState<FormVariant[]>(product?.variants ?? []);

  const category = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? categories[0],
    [categories, categoryId],
  );
  const extraFields = (category?.fields ?? []).filter((field) => !columnKeys.has(field.key));
  const groups = groupFields(extraFields);
  const rates = category?.displayRates ?? [];

  useEffect(() => {
    const pendingFocus = imageFocus.current;
    if (!pendingFocus) return;
    imageFocus.current = null;
    if (pendingFocus.action === "picker" || !pendingFocus.id) {
      document.getElementById(`${formId}-images`)?.focus();
      return;
    }
    const card = document.querySelector<HTMLElement>(`[data-image-id="${cssEscape(pendingFocus.id)}"]`);
    if (!card) {
      document.getElementById(`${formId}-images`)?.focus();
      return;
    }
    if (pendingFocus.action === "remove") {
      card.querySelector<HTMLElement>('[data-image-action="remove"]')?.focus();
      return;
    }
    const preferred = card.querySelector<HTMLElement>(`[data-image-action="${pendingFocus.action}"]:not(:disabled)`);
    const fallback = card.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled)");
    (preferred ?? fallback)?.focus();
  }, [images, formId]);

  useEffect(() => {
    const pendingFocus = variantFocus.current;
    if (pendingFocus === null) return;
    variantFocus.current = null;
    if (pendingFocus === "add") {
      document.getElementById(`${formId}-add-variant`)?.focus();
      return;
    }
    focusFirst(document.getElementById(`${formId}-variant-${pendingFocus}`));
  }, [variants, formId]);

  if (!category) {
    return <p className="text-sm text-muted-foreground">Create an active category before adding a product.</p>;
  }

  const brandField = spec(category, "brand");
  const priceField = spec(category, "price");
  const contractorField = spec(category, "contractorDiscount");
  const consumerField = spec(category, "consumerDiscount");

  function parentValue(key: string) {
    if (key === "name") return name;
    if (key === "mrp") return mrp;
    if (key === "price") return price;
    if (key === "contractorDiscount") return contractorDiscount;
    if (key === "consumerDiscount") return consumerDiscount;
    if (key === "points") return points;
    return attributes[key] ?? "";
  }

  const variantPayload = variants.map((variant) => ({
    id: variant.id,
    hasImage: Boolean(variant.imageUrl),
    copy: variant.copy,
    values: Object.fromEntries(
      category.variantFields
        .filter((field) => field.type !== "image")
        .map((field) => [field.key, variant.copy[field.key] ? parentValue(field.key) : variant.values[field.key] ?? ""]),
    ),
  }));

  return (
    <ActionForm action={action} state={state} autoComplete="off" className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="attributes" value={JSON.stringify(attributes)} />
      <input type="hidden" name="variants" value={JSON.stringify(variantPayload)} />
      <input type="hidden" name="existingImages" value={JSON.stringify(images.map((image, index) => ({ ...image, sortOrder: index })))} />
      <FormBanner state={state} />

      <section aria-labelledby={`${formId}-info`} className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 id={`${formId}-info`} className="font-heading text-base font-semibold">Product information</h2>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <FormField label="Category" name="categoryId" state={state}>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => {
                const next = event.target.value;
                setCategoryId(next);
                setVariants(next === product?.categoryId ? product.variants : []);
              }}
              className="pvrd-select h-9 px-3"
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Brand" name="brandId" state={state} required={brandField?.required !== false}>
            <select name="brandId" defaultValue={product?.brandId ?? ""} className="pvrd-select h-9 px-3">
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Name" name="name" state={state} required>
            <Input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} />
          </FormField>
          <FormField label="SKU" name="sku" state={state}>
            <Input name="sku" defaultValue={product?.sku ?? ""} maxLength={64} />
          </FormField>
          <FormField label="Status" name="status">
            <select name="status" defaultValue={product?.status ?? "active"} className="pvrd-select h-9 px-3">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="hidden">Hidden</option>
            </select>
          </FormField>
        </div>
        {groups.map((group) => (
          <div key={group.name || "details"} className="space-y-3">
            {group.name ? <h3 className="text-sm font-semibold">{group.name}</h3> : null}
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.fields.map((field) => (
                <SpecField
                  key={field.key}
                  field={field}
                  value={attributes[field.key] ?? ""}
                  invalid={state?.field === field.key}
                  message={state?.field === field.key ? state.error : undefined}
                  onChange={(value) => setAttributes((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
            <DisplayRates rates={ratesFor(rates, group.fields)} attributes={attributes} />
          </div>
        ))}
        <FormField
          label="Description"
          name="description"
          state={state}
          hint="Enter adds a new line. Press Ctrl+Enter or ⌘+Enter to save."
        >
          <Textarea name="description" defaultValue={product?.description ?? ""} maxLength={2000} />
        </FormField>
      </section>

      <section aria-labelledby={`${formId}-pricing`} className="pvrd-card space-y-4 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 id={`${formId}-pricing`} className="font-heading text-base font-semibold">Pricing and points</h2>
          <p className="text-sm text-muted-foreground">
            MRP is the public retail price. Trade price is the dealer rate for retailers and carpenters.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label={pricingFieldHelp.mrp.label} name="mrp" state={state} required tooltip={pricingFieldHelp.mrp.tooltip}>
            <NumberInput name="mrp" min={0} max={9999999999.99} step="0.01" value={mrp} onChange={(event) => setMrp(event.target.value)} />
          </FormField>
          {priceField ? (
            <FormField label={pricingFieldHelp.price.label} name="price" state={state} required={priceField.required} tooltip={pricingFieldHelp.price.tooltip}>
              <NumberInput name="price" min={0} max={9999999999.99} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
            </FormField>
          ) : null}
          {contractorField ? (
            <FormField label={contractorField.label} name="contractorDiscount" state={state} required={contractorField.required}>
              <NumberInput name="contractorDiscount" min={0} max={999.99} step="0.01" value={contractorDiscount} onChange={(event) => setContractorDiscount(event.target.value)} />
            </FormField>
          ) : null}
          {consumerField ? (
            <FormField label={consumerField.label} name="consumerDiscount" state={state} required={consumerField.required}>
              <NumberInput name="consumerDiscount" min={0} max={999.99} step="0.01" value={consumerDiscount} onChange={(event) => setConsumerDiscount(event.target.value)} />
            </FormField>
          ) : null}
          <FormField
            label="Points"
            name="points"
            state={state}
            tooltip="Saved on the product now. Earning and redemption arrive in the next release."
          >
            <NumberInput name="points" integer min={0} max={1000000} step={1} value={points} onChange={(event) => setPoints(event.target.value)} />
          </FormField>
        </div>
      </section>

      <section aria-labelledby={`${formId}-images-heading`} className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 id={`${formId}-images-heading`} className="font-heading text-base font-semibold">Images</h2>
        {images.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Arrow keys move between Primary choices. Alt+Up or Alt+Down moves the image you are on.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3" onKeyDown={onImageKeyDown}>
          {images.map((image, index) => (
            <div key={image.id} data-image-card="" data-image-id={image.id} data-image-index={index} className="w-28 space-y-2">
              <img src={image.url} alt="" className="h-20 w-full rounded-lg border border-border object-cover" />
              <label className="flex items-center gap-2 text-[11px]">
                <input
                  type="radio"
                  name="primaryImage"
                  value={image.id}
                  className="pvrd-radio"
                  checked={image.isPrimary}
                  onChange={() => setImages((current) => current.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })))}
                />
                Primary
              </label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" data-image-action="up" aria-label={`Move image ${index + 1} up`} onClick={() => moveImage(index, -1)} disabled={index === 0}>Up</Button>
                <Button type="button" variant="outline" size="sm" data-image-action="down" aria-label={`Move image ${index + 1} down`} onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>Down</Button>
                <Button type="button" variant="outline" size="sm" data-image-action="remove" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(image.id)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
        <ImageDropzone id={`${formId}-images`} name="images" multiple required={!product && images.length === 0} invalid={state?.field === "images"} label={product ? "Add images" : "Product images"} />
        <FieldIssue state={state} name="images" />
        <CheckField name="newPrimary">Use the first new upload as the primary image</CheckField>
      </section>

      {category.variantFields.length > 0 ? (
        <section aria-labelledby={`${formId}-variants`} className="pvrd-card space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${formId}-variants`} className="font-heading text-base font-semibold">Variants</h2>
            <Button id={`${formId}-add-variant`} type="button" variant="outline" onClick={addVariant}>
              Add variant
            </Button>
          </div>
          {variants.map((variant, index) => (
            <article id={`${formId}-variant-${index}`} key={variant.id ?? index} className="grid min-w-0 gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-2" aria-label={`Variant ${index + 1}`}>
              {category.variantFields.map((field) => field.type === "image" ? (
                <VariantImageField key={field.key} index={index} field={field} imageUrl={variant.imageUrl} />
              ) : (
                <div key={field.key} className="grid gap-2">
                  <SpecField
                    field={withPricingLabel(field)}
                    tooltip={pricingTooltip(field)}
                    trackField={false}
                    value={variant.copy[field.key] ? parentValue(field.key) : variant.values[field.key] ?? ""}
                    disabled={Boolean(variant.copy[field.key])}
                    onChange={(value) => patchVariant(index, { values: { ...variant.values, [field.key]: value } })}
                  />
                  {field.copyFromParent ? (
                    <CheckField
                      checked={Boolean(variant.copy[field.key])}
                      onChange={(event) => patchVariant(index, { copy: { ...variant.copy, [field.key]: event.target.checked } })}
                    >
                      Copy {withPricingLabel(field).label.toLowerCase()} from the main form
                    </CheckField>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="outline" aria-label={`Remove variant ${index + 1}`} onClick={() => removeVariant(index)}>
                Remove variant
              </Button>
            </article>
          ))}
        </section>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" render={<Link href="/admin/products" />}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save product"}</Button>
      </div>
    </ActionForm>
  );

  function onImageKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    const card = (event.target as HTMLElement).closest("[data-image-index]");
    if (!card) return;
    const index = Number(card.getAttribute("data-image-index"));
    if (Number.isNaN(index)) return;
    event.preventDefault();
    moveImage(index, event.key === "ArrowUp" ? -1 : 1);
  }

  function moveImage(index: number, direction: -1 | 1) {
    const id = images[index]?.id;
    const target = index + direction;
    if (!id || target < 0 || target >= images.length) return;
    imageFocus.current = { id, action: direction < 0 ? "up" : "down" };
    setImages((current) => {
      const next = [...current];
      const nextTarget = index + direction;
      if (nextTarget < 0 || nextTarget >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeImage(id: string) {
    const index = images.findIndex((image) => image.id === id);
    const neighbor = images[index + 1] ?? images[index - 1];
    imageFocus.current = neighbor ? { id: neighbor.id, action: "remove" } : { id: "", action: "picker" };
    setImages((current) => current.filter((image) => image.id !== id));
  }

  function addVariant() {
    variantFocus.current = variants.length;
    setVariants((current) => [...current, blankVariant(category.variantFields)]);
  }

  function removeVariant(index: number) {
    variantFocus.current = variants.length === 1 ? "add" : index < variants.length - 1 ? index : index - 1;
    setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function patchVariant(index: number, patch: Partial<FormVariant>) {
    setVariants((current) => current.map((variant, itemIndex) => (itemIndex === index ? { ...variant, ...patch } : variant)));
  }
}

function spec(category: FormCategory, key: string) {
  return category.fields.find((field) => field.key === key);
}

function withPricingLabel(field: CategoryField) {
  if (field.key !== "mrp" && field.key !== "price") return field;
  return { ...field, label: pricingFieldHelp[field.key].label };
}

function pricingTooltip(field: CategoryField) {
  if (field.key !== "mrp" && field.key !== "price") return undefined;
  return pricingFieldHelp[field.key].tooltip;
}

function groupFields(fields: CategoryField[]) {
  const groups: { name: string; fields: CategoryField[] }[] = [];
  for (const field of fields) {
    const name = field.group ?? "";
    const group = groups.find((item) => item.name === name);
    if (group) group.fields.push(field);
    else groups.push({ name, fields: [field] });
  }
  return groups;
}

function ratesFor(rates: DisplayRate[], fields: CategoryField[]) {
  const keys = new Set(fields.map((field) => field.key));
  return rates.filter((rate) => rate.keys.some((key) => keys.has(key)));
}

function DisplayRates({ rates, attributes }: { rates: DisplayRate[]; attributes: Record<string, string> }) {
  if (rates.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rates.map((rate) => {
        const value = computeDisplayRate(rate.keys, attributes);
        return (
          <div key={rate.label} className="rounded-xl border border-border px-3 py-2">
            <p className="text-xs font-medium">{rate.label}</p>
            <p className="text-[11px] text-muted-foreground">{rate.formula}</p>
            <p className="mt-1 text-sm font-semibold">{value ?? "Enter the sizes to calculate this rate."}</p>
          </div>
        );
      })}
    </div>
  );
}

function SpecField({
  field,
  value,
  onChange,
  disabled = false,
  invalid = false,
  message,
  trackField = true,
  tooltip,
}: {
  field: CategoryField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  message?: string;
  trackField?: boolean;
  tooltip?: string;
}) {
  const autoId = useId();
  const errorId = invalid ? `${autoId}-error` : undefined;
  const options = field.options ?? [];
  const choices = value && !options.includes(value) ? [value, ...options] : options;
  const required = Boolean(field.required && !disabled);
  const control = {
    id: autoId,
    "data-field": trackField ? field.key : undefined,
    disabled,
    required,
    "aria-invalid": invalid || undefined,
    "aria-describedby": errorId,
  };

  if (field.type === "checkbox") {
    return (
      <div className="grid gap-1.5" data-focus-anchor="">
        <label className="flex min-h-9 items-center gap-2 text-sm">
          <input
            {...control}
            type="checkbox"
            className="pvrd-check"
            checked={value === "yes"}
            onChange={(event) => onChange(event.target.checked ? "yes" : "")}
          />
          <span>
            {field.label}
            {field.required ? <RequiredMark /> : null}
          </span>
        </label>
        {invalid && message ? <p id={errorId} role="alert" className="text-sm text-destructive">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-1.5" data-focus-anchor="">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={autoId}>
          {field.label}
          {field.required ? <RequiredMark /> : null}
        </Label>
        {tooltip ? <FieldTip text={tooltip} /> : null}
      </div>
      {field.type === "textarea" ? (
        <Textarea {...control} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : field.type === "select" ? (
        <select {...control} value={value} onChange={(event) => onChange(event.target.value)} className="pvrd-select h-9 px-3">
          <option value="">Select {field.label.toLowerCase()}</option>
          {choices.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <NumberInput {...control} min={0} step="any" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input {...control} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {invalid && message ? <p id={errorId} role="alert" className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}

function VariantImageField({ index, field, imageUrl }: { index: number; field: CategoryField; imageUrl?: string | null }) {
  const id = useId();
  const previewUrl = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  function useFile(file: File | undefined) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewUrl.current = url;
    setPreview(url);
  }

  return (
    <div className="grid gap-1.5 sm:col-span-2" data-focus-anchor="">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? <RequiredMark /> : null}
      </Label>
      <div
        className="rounded-xl border border-dashed border-border bg-background p-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
          const input = event.currentTarget.querySelector("input");
          if (!file || !input) return;
          const transfer = new DataTransfer();
          transfer.items.add(file);
          input.files = transfer.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          useFile(file);
        }}
      >
        <Input
          id={id}
          name={`variantImage_${index}`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={field.required && !imageUrl}
          aria-describedby={`${id}-hint`}
          onChange={(event) => useFile(event.target.files?.[0])}
        />
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          Choose a file with Enter or Space, or drop an image here.
        </p>
      </div>
      {preview || imageUrl ? <img src={preview || imageUrl || ""} alt="" className="h-20 w-28 rounded-lg border border-border object-cover" /> : null}
    </div>
  );
}

function focusFirst(root: ParentNode | null) {
  root?.querySelector<HTMLElement>('input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)')?.focus();
}

function cssEscape(value: string) {
  return CSS.escape(value);
}

function blankVariant(fields: CategoryField[]): FormVariant {
  const copy: Record<string, boolean> = {};
  for (const field of fields) {
    if (field.copyFromParent) copy[field.key] = true;
  }
  return { values: {}, copy };
}
