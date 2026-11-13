"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProduct } from "@/lib/actions/products";
import type { CategoryField } from "@/lib/categories/field-schemas";

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
};

type FormVariant = {
  id?: string;
  name: string;
  finish: string;
  size: string;
  price: string;
  copyPrice: boolean;
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
  const [price, setPrice] = useState(product?.price ?? "");
  const [attributes, setAttributes] = useState<Record<string, string>>(product?.attributes ?? {});
  const [images, setImages] = useState(product?.images ?? []);
  const [variants, setVariants] = useState<FormVariant[]>(product?.variants ?? []);

  const category = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? categories[0],
    [categories, categoryId],
  );
  const extraFields = (category?.fields ?? []).filter((field) => !columnKeys.has(field.key));

  if (!category) {
    return <p className="text-sm text-muted-foreground">Create an active category before adding a product.</p>;
  }
  if (brands.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a brand before adding a product. <Link href="/admin/brands/new" className="font-medium text-primary">Add brand</Link>
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="attributes" value={JSON.stringify(attributes)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="existingImages" value={JSON.stringify(images.map((image, index) => ({ ...image, sortOrder: index })))} />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <section className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">Product information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>Category</Label>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label>Brand</Label>
            <select name="brandId" defaultValue={product?.brandId ?? ""} required className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label>Name</Label>
            <Input name="name" defaultValue={product?.name} required />
          </label>
          <label className="grid gap-1.5">
            <Label>SKU</Label>
            <Input name="sku" defaultValue={product?.sku ?? ""} />
          </label>
          <label className="grid gap-1.5">
            <Label>Status</Label>
            <select name="status" defaultValue={product?.status ?? "active"} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
        </div>
        {category.displayFormula ? (
          <p className="text-xs text-muted-foreground">Display rate: {category.displayFormula}</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {extraFields.map((field) => (
            <label key={field.key} className="grid gap-1.5">
              <Label>{field.label}{field.required ? " *" : ""}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={attributes[field.key] ?? ""}
                  onChange={(event) => setAttributes((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={attributes[field.key] ?? ""}
                  onChange={(event) => setAttributes((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        <label className="grid gap-1.5">
          <Label>Description</Label>
          <Textarea name="description" defaultValue={product?.description ?? ""} />
        </label>
      </section>

      <section className="pvrd-card space-y-4 p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">Pricing and points</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1.5"><Label>MRP</Label><Input name="mrp" type="number" min="0" step="0.01" defaultValue={product?.mrp} required /></label>
          <label className="grid gap-1.5"><Label>Price</Label><Input name="price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
          <label className="grid gap-1.5"><Label>Contractor discount %</Label><Input name="contractorDiscount" type="number" min="0" step="0.01" defaultValue={product?.contractorDiscount ?? ""} /></label>
          <label className="grid gap-1.5"><Label>Consumer discount %</Label><Input name="consumerDiscount" type="number" min="0" step="0.01" defaultValue={product?.consumerDiscount ?? ""} /></label>
          <label className="grid gap-1.5"><Label>Points</Label><Input name="points" type="number" min="0" defaultValue={product?.points ?? 0} /></label>
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
                <Button type="button" variant="outline" size="sm" onClick={() => moveImage(index, -1)}>Up</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
        <label className="grid gap-1.5">
          <Label>{product ? "Add images" : "Product images"}</Label>
          <Input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple required={!product} />
          <span className="text-xs text-muted-foreground">Only a file you choose here is stored. Photos already on the server are left where they are.</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="newPrimary" />
          Use the first new upload as the primary image
        </label>
      </section>

      {category.variantFields.length > 0 ? (
        <section className="pvrd-card space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold">Variants</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVariants((current) => [...current, { name: "", finish: "", size: "", price, copyPrice: true }])}
            >
              Add variant
            </Button>
          </div>
          {variants.map((variant, index) => (
            <article key={variant.id ?? index} className="grid gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-2">
              <label className="grid gap-1.5"><Label>Name</Label><Input value={variant.name} onChange={(event) => patchVariant(index, { name: event.target.value })} /></label>
              <label className="grid gap-1.5"><Label>Finish</Label><Input value={variant.finish} onChange={(event) => patchVariant(index, { finish: event.target.value })} /></label>
              <label className="grid gap-1.5"><Label>Size</Label><Input value={variant.size} onChange={(event) => patchVariant(index, { size: event.target.value })} /></label>
              <label className="grid gap-1.5">
                <Label>Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.copyPrice ? price : variant.price}
                  disabled={variant.copyPrice}
                  onChange={(event) => patchVariant(index, { price: event.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={variant.copyPrice}
                  onChange={(event) => patchVariant(index, { copyPrice: event.target.checked, price: event.target.checked ? price : variant.price })}
                />
                Copy price from main form
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <Label>Variant image</Label>
                <Input name={`variantImage_${index}`} type="file" accept="image/png,image/jpeg,image/webp" />
              </label>
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
    </form>
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
