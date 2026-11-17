"use client";

import { useEffect, useId, useRef, useState } from "react";

const accepted = ["image/png", "image/jpeg", "image/webp"];

export function ImageDropzone({
  id,
  name,
  multiple = false,
  required = false,
  invalid = false,
  label,
}: {
  id?: string;
  name: string;
  multiple?: boolean;
  required?: boolean;
  invalid?: boolean;
  label: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const titleId = `${inputId}-title`;
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<{ url: string; name: string }[]>([]);
  const [over, setOver] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) URL.revokeObjectURL(preview.url);
    };
  }, []);

  function take(list: FileList | File[]) {
    const files = [...list].filter((file) => accepted.includes(file.type));
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
    setPreviews((current) => {
      for (const preview of current) URL.revokeObjectURL(preview.url);
      return files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    });
  }

  function removeAt(index: number) {
    const nextFiles = [...(inputRef.current?.files ?? [])].filter((_, fileIndex) => fileIndex !== index);
    const transfer = new DataTransfer();
    for (const file of nextFiles) transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
    setPreviews((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((_, previewIndex) => previewIndex !== index);
    });
    inputRef.current?.focus();
  }

  return (
    <div data-focus-anchor="" className="space-y-3">
      <div
        className={`relative block cursor-pointer rounded-xl border border-dashed p-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 ${invalid ? "border-destructive bg-destructive/5" : over ? "border-primary bg-primary/5" : "border-border bg-muted/40"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accepted.join(",")}
          multiple={multiple}
          required={required}
          aria-labelledby={titleId}
          aria-describedby={hintId}
          aria-invalid={invalid || undefined}
          className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
          onChange={(event) => take(event.target.files ?? [])}
        />
        <div className="pointer-events-none flex flex-wrap items-center justify-between gap-3">
          <div>
            <p id={titleId} className="text-sm font-medium">{label}</p>
            <p id={hintId} className="text-xs text-muted-foreground">
              Press Enter or Space to browse, or drag a JPG, PNG, or WEBP here.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">Browse</span>
        </div>
      </div>
      {previews.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <figure key={preview.url} className="w-28">
              <img src={preview.url} alt="" className="h-20 w-full rounded-lg border border-border object-cover" />
              <figcaption className="mt-1 truncate text-[11px] text-muted-foreground">{preview.name}</figcaption>
              <button
                type="button"
                className="mt-1 text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Remove ${preview.name}`}
                onClick={() => removeAt(index)}
              >
                Remove
              </button>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
