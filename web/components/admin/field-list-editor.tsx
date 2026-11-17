"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryField, FieldType } from "@/lib/categories/field-schemas";
import { fieldTypes, lockedFieldKeys } from "@/lib/catalogue/fields";

type EditorField = CategoryField;

export function FieldListEditor({
  name,
  title,
  initial,
}: {
  name: string;
  title: string;
  initial: EditorField[];
}) {
  const [fields, setFields] = useState<EditorField[]>(initial);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [required, setRequired] = useState(false);
  const [composerInvalid, setComposerInvalid] = useState(false);
  const fieldFocus = useRef<{ key: string; action: "up" | "down" | "remove" } | null>(null);

  useEffect(() => {
    const pending = fieldFocus.current;
    if (!pending) return;
    fieldFocus.current = null;
    if (pending.action === "remove") {
      document.getElementById(`${name}-add-label`)?.focus();
      return;
    }
    const row = document.querySelector<HTMLElement>(`[data-field-key="${cssEscape(pending.key)}"]`);
    const preferred = row?.querySelector<HTMLElement>(`[data-field-action="${pending.action}"]:not(:disabled)`);
    const fallback = row?.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), button:not(:disabled)");
    (preferred ?? fallback)?.focus();
  }, [fields, name]);

  const addField = () => {
    const nextLabel = label.trim();
    if (!nextLabel) {
      setComposerInvalid(true);
      document.getElementById(`${name}-add-label`)?.focus();
      return;
    }
    const key = uniqueKey(nextLabel, fields.map((field) => field.key));
    setFields((current) => [...current, { key, label: nextLabel, type, required }]);
    setLabel("");
    setRequired(false);
    setComposerInvalid(false);
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "hidden") return;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    event.preventDefault();
    if (target.closest("[data-add-field]")) {
      addField();
      return;
    }
    const items = tabbables(event.currentTarget);
    const next = items[items.indexOf(target) + 1];
    if (next) next.focus();
    else target.closest("form")?.querySelector<HTMLElement>('button[type="submit"]:not(:disabled)')?.focus();
  };

  return (
    <div className="space-y-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50" data-field={name} tabIndex={-1} onKeyDown={onEditorKeyDown}>
      <input type="hidden" name={name} value={JSON.stringify(fields)} />
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.key} data-field-key={field.key} className="space-y-2 rounded-xl bg-muted/60 p-3">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
              <Input
                value={field.label}
                aria-label={`Label for field ${index + 1}`}
                onChange={(event) => update(index, { label: event.target.value })}
              />
              <select
                value={field.type}
                aria-label={`Type for field ${index + 1}`}
                onChange={(event) => update(index, { type: event.target.value as FieldType })}
                className="pvrd-select"
              >
                {fieldTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="pvrd-check"
                  checked={field.required}
                  onChange={(event) => update(index, { required: event.target.checked })}
                />
                Required
              </label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" data-field-action="up" aria-label={`Move ${field.label} up`} onClick={() => move(index, -1)} disabled={index === 0}>Up</Button>
                <Button type="button" variant="outline" size="sm" data-field-action="down" aria-label={`Move ${field.label} down`} onClick={() => move(index, 1)} disabled={index === fields.length - 1}>Down</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-field-action="remove"
                  aria-label={`Remove ${field.label}`}
                  disabled={lockedFieldKeys.has(field.key)}
                  onClick={() => removeField(field.key)}
                >
                  Remove
                </Button>
              </div>
            </div>
            {field.type === "select" ? (
              <Input
                value={(field.options ?? []).join(", ")}
                aria-label={`Options for ${field.label}`}
                placeholder="Dropdown options, separated by commas"
                onChange={(event) =>
                  update(index, {
                    options: event.target.value.split(",").map((option) => option.trim()),
                  })
                }
              />
            ) : null}
          </div>
        ))}
      </div>
      <div data-add-field="" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={`${name}-add-label`}
          value={label}
          aria-label="New field label"
          aria-invalid={composerInvalid || undefined}
          aria-describedby={composerInvalid ? `${name}-add-error` : undefined}
          placeholder="New field label"
          onChange={(event) => {
            setLabel(event.target.value);
            if (composerInvalid) setComposerInvalid(false);
          }}
        />
        <select value={type} aria-label="New field type" onChange={(event) => setType(event.target.value as FieldType)} className="pvrd-select sm:w-36 sm:shrink-0">
          {fieldTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="pvrd-check" checked={required} onChange={(event) => setRequired(event.target.checked)} />
          Required
        </label>
        <Button type="button" variant="outline" onClick={addField}>Add field</Button>
      </div>
      {composerInvalid ? (
        <p id={`${name}-add-error`} role="alert" className="text-sm text-destructive">
          Enter a field label before adding it.
        </p>
      ) : null}
    </div>
  );

  function update(index: number, patch: Partial<EditorField>) {
    setFields((current) => current.map((field, itemIndex) => (itemIndex === index ? { ...field, ...patch } : field)));
  }

  function move(index: number, direction: -1 | 1) {
    const field = fields[index];
    const target = index + direction;
    if (!field || target < 0 || target >= fields.length) return;
    fieldFocus.current = { key: field.key, action: direction < 0 ? "up" : "down" };
    setFields((current) => {
      const next = [...current];
      const nextTarget = index + direction;
      if (nextTarget < 0 || nextTarget >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeField(key: string) {
    fieldFocus.current = { key, action: "remove" };
    setFields((current) => current.filter((item) => item.key !== key));
  }
}

function tabbables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("button, input, select, textarea")].filter((element) => {
    if (element.hasAttribute("disabled")) return false;
    if (element instanceof HTMLInputElement && element.type === "hidden") return false;
    return element.tabIndex >= 0;
  });
}

function cssEscape(value: string) {
  return CSS.escape(value);
}

function uniqueKey(label: string, existing: string[]) {
  const base = label
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, "") || "field";
  let key = base;
  let suffix = 2;
  while (existing.includes(key)) key = `${base}${suffix++}`;
  return key;
}
