"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveProduct } from "@/lib/actions/products";
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
    <ActionForm action={action} state={state} className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="attributes" value={JSON.stringify(attributes)} />
      <input type="hidden" name="variants" value={JSON.stringify(variantPayload)} />
      <input type="hidden" name="existingImages" value={JSON.stringify(images.map((image, index) => ({ ...image, sortOrder: index })))} />
      <FormBanner state={state} />

      <section className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">Product information</h2>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1.5">
            <Label>Category</Label>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => {
                const next = event.target.value;
                setCategoryId(next);
                setVariants(next === product?.categoryId ? product.variants : []);
              }}
              className="pvrd-select h-9 px-3"
              {...invalidProps(state, "categoryId")}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <FieldIssue state={state} name="categoryId" />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <Label>Brand{brandField?.required === false ? "" : " *"}</Label>
            <select name="brandId" defaultValue={product?.brandId ?? ""} required={brandField?.required !== false} className="pvrd-select h-9 px-3" {...invalidProps(state, "brandId")}>
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <FieldIssue state={state} name="brandId" />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <Label>Name</Label>
            <Input name="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} {...invalidProps(state, "name")} />
            <FieldIssue state={state} name="name" />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <Label>SKU</Label>
            <Input name="sku" defaultValue={product?.sku ?? ""} maxLength={64} {...invalidProps(state, "sku")} />
            <FieldIssue state={state} name="sku" />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <Label>Status</Label>
            <select name="status" defaultValue={product?.status ?? "active"} className="pvrd-select h-9 px-3">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
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
        <label className="grid gap-1.5">
          <Label>Description</Label>
          <Textarea name="description" defaultValue={product?.description ?? ""} maxLength={2000} {...invalidProps(state, "description")} />
          <FieldIssue state={state} name="description" />
        </label>
      </section>

      <section className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">Pricing and points</h2>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid min-w-0 gap-1.5">
            <Label>MRP</Label>
            <NumberInput name="mrp" min={0} max={9999999999.99} step="0.01" value={mrp} onChange={(event) => setMrp(event.target.value)} required {...invalidProps(state, "mrp")} />
            <FieldIssue state={state} name="mrp" />
          </label>
          {priceField ? (
            <label className="grid min-w-0 gap-1.5">
              <Label>{priceField.label}{priceField.required ? " *" : ""}</Label>
              <NumberInput name="price" min={0} max={9999999999.99} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required={priceField.required} {...invalidProps(state, "price")} />
              <FieldIssue state={state} name="price" />
            </label>
          ) : null}
          {contractorField ? (
            <label className="grid min-w-0 gap-1.5">
              <Label>{contractorField.label}{contractorField.required ? " *" : ""}</Label>
              <NumberInput name="contractorDiscount" min={0} max={999.99} step="0.01" value={contractorDiscount} onChange={(event) => setContractorDiscount(event.target.value)} required={contractorField.required} {...invalidProps(state, "contractorDiscount")} />
              <FieldIssue state={state} name="contractorDiscount" />
            </label>
          ) : null}
          {consumerField ? (
            <label className="grid min-w-0 gap-1.5">
              <Label>{consumerField.label}{consumerField.required ? " *" : ""}</Label>
              <NumberInput name="consumerDiscount" min={0} max={999.99} step="0.01" value={consumerDiscount} onChange={(event) => setConsumerDiscount(event.target.value)} required={consumerField.required} {...invalidProps(state, "consumerDiscount")} />
              <FieldIssue state={state} name="consumerDiscount" />
            </label>
          ) : null}
          <label className="grid min-w-0 gap-1.5">
            <Label>Points</Label>
            <NumberInput name="points" integer min={0} max={1000000} step={1} value={points} onChange={(event) => setPoints(event.target.value)} {...invalidProps(state, "points")} />
            <FieldIssue state={state} name="points" />
          </label>
        </div>
      </section>

      <section className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={image.id} className="w-28 space-y-2">
              <img src={image.url} alt="" className="h-20 w-full rounded-lg border border-border object-cover" />
              <label className="flex items-center gap-1 text-[11px]">
                <input
                  type="radio"
                  name="primaryImage"
                  checked={image.isPrimary}
                  onChange={() => setImages((current) => current.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })))}
                />
                Primary
              </label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => moveImage(index, -1)} disabled={index === 0}>Up</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>Down</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
        <ImageDropzone name="images" multiple required={!product && images.length === 0} invalid={state?.field === "images"} label={product ? "Add images" : "Product images"} />
        <FieldIssue state={state} name="images" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="newPrimary" />
          Use the first new upload as the primary image
        </label>
      </section>

      {category.variantFields.length > 0 ? (
        <section className="pvrd-card space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold">Variants</h2>
            <Button type="button" variant="outline" onClick={() => setVariants((current) => [...current, blankVariant(category.variantFields)])}>
              Add variant
            </Button>
          </div>
          {variants.map((variant, index) => (
            <article key={variant.id ?? index} className="grid min-w-0 gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-2">
              {category.variantFields.map((field) => field.type === "image" ? (
                <VariantImageField key={field.key} index={index} field={field} imageUrl={variant.imageUrl} />
              ) : (
                <div key={field.key} className="grid gap-2">
                  <SpecField
                    field={field}
                    value={variant.copy[field.key] ? parentValue(field.key) : variant.values[field.key] ?? ""}
                    disabled={Boolean(variant.copy[field.key])}
                    onChange={(value) => patchVariant(index, { values: { ...variant.values, [field.key]: value } })}
                  />
                  {field.copyFromParent ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(variant.copy[field.key])}
                        onChange={(event) => patchVariant(index, { copy: { ...variant.copy, [field.key]: event.target.checked } })}
                      />
                      Copy {field.label.toLowerCase()} from main form
                    </label>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
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

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function patchVariant(index: number, patch: Partial<FormVariant>) {
    setVariants((current) => current.map((variant, itemIndex) => (itemIndex === index ? { ...variant, ...patch } : variant)));
  }
}

function spec(category: FormCategory, key: string) {
  return category.fields.find((field) => field.key === key);
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
}: {
  field: CategoryField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  message?: string;
}) {
  const options = field.options ?? [];
  const choices = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <label className="grid min-w-0 gap-1.5">
      <Label>{field.label}{field.required ? " *" : ""}</Label>
      {field.type === "textarea" ? (
        <Textarea value={value} disabled={disabled} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.target.value)} />
      ) : field.type === "select" ? (
        <select value={value} disabled={disabled} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.target.value)} className="pvrd-select h-9 px-3">
          <option value="">Select {field.label.toLowerCase()}</option>
          {choices.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <input type="checkbox" checked={value === "yes"} disabled={disabled} onChange={(event) => onChange(event.target.checked ? "yes" : "")} />
      ) : (
        field.type === "number" ? (
          <NumberInput min={0} step="any" value={value} disabled={disabled} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <Input value={value} disabled={disabled} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.target.value)} />
        )
      )}
      {invalid && message ? <p className="text-sm text-destructive">{message}</p> : null}
    </label>
  );
}

function VariantImageField({ index, field, imageUrl }: { index: number; field: CategoryField; imageUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label className="grid gap-1.5 sm:col-span-2">
      <Label>{field.label}{field.required ? " *" : ""}</Label>
      <div
        className="rounded-xl border border-dashed border-border bg-background p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
          const input = event.currentTarget.querySelector("input");
          if (!file || !input) return;
          const transfer = new DataTransfer();
          transfer.items.add(file);
          input.files = transfer.files;
          setPreview(URL.createObjectURL(file));
        }}
      >
        <Input
          name={`variantImage_${index}`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">Drop an image here to preview it before saving.</p>
      </div>
      {preview || imageUrl ? <img src={preview || imageUrl || ""} alt="" className="h-20 w-28 rounded-lg border border-border object-cover" /> : null}
    </label>
  );
}

function blankVariant(fields: CategoryField[]): FormVariant {
  const copy: Record<string, boolean> = {};
  for (const field of fields) {
    if (field.copyFromParent) copy[field.key] = true;
  }
  return { values: {}, copy };
}
