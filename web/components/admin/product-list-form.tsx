"use client";

import { bulkProducts } from "@/lib/actions/products";

export function ProductListForm({ children }: { children: React.ReactNode }) {
  return (
    <form
      action={bulkProducts}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const ids = data.getAll("ids");
        if (ids.length === 0) {
          event.preventDefault();
          window.alert("Select at least one product.");
          return;
        }
        if (data.get("bulk") === "delete" && !window.confirm(`Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}

export function SelectAll() {
  return (
    <input
      type="checkbox"
      aria-label="Select all products"
      onChange={(event) => {
        const form = event.currentTarget.form;
        if (!form) return;
        form.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((input) => {
          input.checked = event.currentTarget.checked;
        });
      }}
    />
  );
}
