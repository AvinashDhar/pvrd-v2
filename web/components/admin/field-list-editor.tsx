"use client";

import { useState } from "react";
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

  const addField = () => {
    const nextLabel = label.trim();
    if (!nextLabel) return;
    const key = uniqueKey(nextLabel, fields.map((field) => field.key));
    setFields((current) => [...current, { key, label: nextLabel, type, required }]);
    setLabel("");
    setRequired(false);
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(fields)} />
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.key} className="space-y-2 rounded-xl bg-muted/60 p-3">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
              <Input
                value={field.label}
                onChange={(event) => update(index, { label: event.target.value })}
              />
              <select
                value={field.type}
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
                  checked={field.required}
                  onChange={(event) => update(index, { required: event.target.checked })}
                />
                Required
              </label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => move(index, -1)} disabled={index === 0}>Up</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => move(index, 1)} disabled={index === fields.length - 1}>Down</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={lockedFieldKeys.has(field.key)}
                  onClick={() => setFields((current) => current.filter((item) => item.key !== field.key))}
                >
                  Remove
                </Button>
              </div>
            </div>
            {field.type === "select" ? (
              <Input
                value={(field.options ?? []).join(", ")}
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
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={label} placeholder="New field label" onChange={(event) => setLabel(event.target.value)} />
        <select value={type} onChange={(event) => setType(event.target.value as FieldType)} className="pvrd-select sm:w-36 sm:shrink-0">
          {fieldTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
          Required
        </label>
        <Button type="button" variant="outline" onClick={addField}>Add field</Button>
      </div>
    </div>
  );

  function update(index: number, patch: Partial<EditorField>) {
    setFields((current) => current.map((field, itemIndex) => (itemIndex === index ? { ...field, ...patch } : field)));
  }

  function move(index: number, direction: -1 | 1) {
    setFields((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
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
