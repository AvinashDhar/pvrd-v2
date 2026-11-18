"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ActionForm, FormBanner, FormField } from "@/components/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { FieldListEditor } from "@/components/admin/field-list-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { NotifyForm } from "@/components/admin/notify-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteSubcategory, saveSubcategory, setSubcategoryStatus } from "@/lib/actions/subcategories";
import { starterFields } from "@/lib/catalogue/fields";
import type { CategoryField } from "@/lib/categories/field-schemas";

export type SubcategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  sortOrder: number;
  productCount: number;
  imageUrl: string | null;
  fields: CategoryField[];
  variantFields: CategoryField[];
};

type Draft = { key: string };

function newDraftKey() {
  return `d${Math.random().toString(36).slice(2, 10)}`;
}

export function SubcategorySection({
  categoryId,
  parentFields,
  parentVariantFields,
  subcategories,
  state,
}: {
  categoryId?: string;
  parentFields: CategoryField[];
  parentVariantFields: CategoryField[];
  subcategories: SubcategoryRow[];
  state?: { error?: string; field?: string } | null;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const editing = subcategories.find((item) => item.id === editingId) ?? null;

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (!editingId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditingId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [editingId]);

  const addDraft = () => setDrafts((current) => [...current, { key: newDraftKey() }]);
  const removeDraft = (key: string) => setDrafts((current) => current.filter((item) => item.key !== key));

  const sideForms =
    portalReady && categoryId
      ? createPortal(
          <div className="hidden" aria-hidden="true">
            {subcategories.map((item) => (
              <div key={`actions-${item.id}`}>
                <NotifyForm id={`sub-status-${item.id}`} action={setSubcategoryStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value={item.status === "active" ? "hidden" : "active"} />
                </NotifyForm>
                <ConfirmForm
                  id={`sub-delete-${item.id}`}
                  action={deleteSubcategory}
                  message="Delete this subcategory? Products stay in the parent category."
                >
                  <input type="hidden" name="id" value={item.id} />
                </ConfirmForm>
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  const editPortal =
    portalReady && editing && categoryId
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${editing.name}`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setEditingId(null);
            }}
          >
            <div className="w-full max-w-3xl">
              <SubcategoryEditForm
                key={editing.id}
                categoryId={categoryId}
                parentFields={parentFields}
                parentVariantFields={parentVariantFields}
                subcategory={editing}
                onCancel={() => setEditingId(null)}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section className="space-y-4 border-t border-border pt-5" data-field="subcategories">
      {sideForms}
      {editPortal}

      <div>
        <h2 className="font-heading text-base font-semibold">Subcategories</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Same setup as categories — image, product fields, and variants — grouped under this parent. Add one or more
          below, then save the category.
        </p>
      </div>

      {categoryId && subcategories.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Products</th>
                <th className="px-3 py-2 font-medium">Fields</th>
                <th className="px-3 py-2 font-medium">Sort</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{item.productCount}</td>
                  <td className="px-3 py-2">{item.fields.length}</td>
                  <td className="px-3 py-2">{item.sortOrder}</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(item.id)}>
                        Edit
                      </Button>
                      <Button type="submit" size="sm" variant="outline" form={`sub-status-${item.id}`}>
                        {item.status === "active" ? "Hide" : "Activate"}
                      </Button>
                      <Button type="submit" size="sm" variant="destructive" form={`sub-delete-${item.id}`}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {drafts.length === 0
            ? "No subcategories yet. Add one below to help shoppers browse."
            : "Fill in each subcategory below, then save the category."}
        </p>
      )}

      <input type="hidden" name="subDraftKeys" value={JSON.stringify(drafts.map((item) => item.key))} />

      {drafts.length === 0 ? (
        <div>
          <Button type="button" variant="outline" onClick={addDraft}>
            Add subcategory
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <SubcategoryDraftForm
              key={draft.key}
              draftKey={draft.key}
              index={index}
              parentFields={parentFields}
              parentVariantFields={parentVariantFields}
              state={state}
              onRemove={() => removeDraft(draft.key)}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addDraft}>
              Add more subcategory
            </Button>
          </div>
        </div>
      )}

      {state?.field === "subcategories" && state.error ? (
        <p id="subcategories-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}

function SubcategoryDraftForm({
  draftKey,
  index,
  parentFields,
  parentVariantFields,
  state,
  onRemove,
}: {
  draftKey: string;
  index: number;
  parentFields: CategoryField[];
  parentVariantFields: CategoryField[];
  state?: { error?: string; field?: string } | null;
  onRemove: () => void;
}) {
  const prefix = `sub.${draftKey}`;
  const nameField = `${prefix}.name`;
  const imageField = `${prefix}.image`;
  const fieldsField = `${prefix}.fields`;
  const variantFieldsField = `${prefix}.variantFields`;

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border p-4" data-field={prefix}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Subcategory {index + 1}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove subcategory
        </Button>
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField label="Name" name={nameField} state={state} required>
          <Input name={nameField} maxLength={160} />
        </FormField>
        <FormField label="Status" name={`${prefix}.status`} state={state}>
          <select name={`${prefix}.status`} defaultValue="active" className="pvrd-select h-9 px-3">
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </FormField>
        <FormField label="Sort order" name={`${prefix}.sortOrder`} state={state} hint="Lower numbers appear first.">
          <Input name={`${prefix}.sortOrder`} type="number" min={0} max={10000} defaultValue={0} />
        </FormField>
      </div>
      <FormField label="Description" name={`${prefix}.description`} state={state}>
        <Textarea name={`${prefix}.description`} maxLength={2000} rows={3} />
      </FormField>
      <div className="grid gap-2">
        <ImageDropzone name={imageField} required invalid={state?.field === imageField} label="Subcategory image" />
        {state?.field === imageField && state.error ? (
          <p id={`${imageField}-error`} role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <FieldListEditor
          name={fieldsField}
          title="Product fields"
          initial={parentFields.length ? parentFields : starterFields}
        />
        {state?.field === fieldsField && state.error ? (
          <p id={`${fieldsField}-error`} role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
      <FieldListEditor name={variantFieldsField} title="Variant fields" initial={parentVariantFields} />
      {state?.field === variantFieldsField && state.error ? (
        <p id={`${variantFieldsField}-error`} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        New subcategories start from this category’s fields so existing products keep working. You can customise fields
        afterward the same way as categories.
      </p>
    </div>
  );
}

function SubcategoryEditForm({
  categoryId,
  parentFields,
  parentVariantFields,
  subcategory,
  onCancel,
}: {
  categoryId: string;
  parentFields: CategoryField[];
  parentVariantFields: CategoryField[];
  subcategory: SubcategoryRow;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(saveSubcategory, null);
  const [removed, setRemoved] = useState(false);

  return (
    <ActionForm
      action={action}
      state={state}
      autoComplete="off"
      className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-lg sm:p-6"
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="id" value={subcategory.id} />
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Edit {subcategory.name}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel edit
        </Button>
      </div>
      <FormBanner state={state} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField label="Name" name="name" state={state} required>
          <Input name="name" defaultValue={subcategory.name} maxLength={160} />
        </FormField>
        <FormField label="Status" name="status" state={state}>
          <select name="status" defaultValue={subcategory.status} className="pvrd-select h-9 px-3">
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </FormField>
        <FormField label="Sort order" name="sortOrder" state={state} hint="Lower numbers appear first.">
          <Input name="sortOrder" type="number" min={0} max={10000} defaultValue={subcategory.sortOrder} />
        </FormField>
      </div>
      <FormField label="Description" name="description" state={state}>
        <Textarea name="description" defaultValue={subcategory.description ?? ""} maxLength={2000} rows={3} />
      </FormField>
      <div className="grid gap-2">
        <ImageDropzone name="image" required={false} invalid={state?.field === "image"} label="Replace image" />
        {state?.field === "image" && state.error ? (
          <p id="image-error" role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {removed ? <input type="hidden" name="removeImage" value="1" /> : null}
        {subcategory.imageUrl && !removed ? (
          <div className="flex items-end gap-3">
            <img
              src={subcategory.imageUrl}
              alt=""
              className="h-24 w-auto rounded-lg border border-border object-contain"
            />
            <Button type="button" variant="outline" onClick={() => setRemoved(true)}>
              Remove image
            </Button>
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <FieldListEditor
          name="fields"
          title="Product fields"
          initial={subcategory.fields?.length ? subcategory.fields : parentFields.length ? parentFields : starterFields}
        />
        {state?.field === "fields" && state.error ? (
          <p id="fields-error" role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
      <FieldListEditor
        name="variantFields"
        title="Variant fields"
        initial={subcategory.variantFields ?? parentVariantFields}
      />
      {state?.field === "variantFields" && state.error ? (
        <p id="variantFields-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save subcategory"}
        </Button>
      </div>
    </ActionForm>
  );
}

/** @deprecated Prefer CategoryForm with subcategories; kept for compatibility. */
export function SubcategoryManager({
  categoryId,
  parentFields,
  parentVariantFields,
  subcategories,
}: {
  categoryId: string;
  parentFields: CategoryField[];
  parentVariantFields: CategoryField[];
  subcategories: SubcategoryRow[];
}) {
  return (
    <section className="pvrd-card space-y-4 p-4 sm:p-6">
      <SubcategorySection
        categoryId={categoryId}
        parentFields={parentFields}
        parentVariantFields={parentVariantFields}
        subcategories={subcategories}
      />
    </section>
  );
}
