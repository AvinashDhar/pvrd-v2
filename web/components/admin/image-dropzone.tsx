"use client";

import { useRef, useState } from "react";

const accepted = ["image/png", "image/jpeg", "image/webp"];

export function ImageDropzone({
  name,
  multiple = false,
  required = false,
  invalid = false,
  label,
}: {
  name: string;
  multiple?: boolean;
  required?: boolean;
  invalid?: boolean;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);

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

  return (
    <div
      aria-invalid={invalid || undefined}
      className={`rounded-xl border border-dashed p-4 ${invalid ? "border-destructive bg-destructive/5" : over ? "border-primary bg-primary/5" : "border-border bg-muted/40"}`}
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
        name={name}
        type="file"
        accept={accepted.join(",")}
        multiple={multiple}
        required={required}
        className="sr-only"
        onChange={(event) => take(event.target.files ?? [])}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Drag a JPG, PNG, or WEBP here, or browse.</p>
        </div>
        <button type="button" className="text-sm font-medium text-primary" onClick={() => inputRef.current?.click()}>
          Browse
        </button>
      </div>
      {previews.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview) => (
            <figure key={preview.url} className="w-28">
              <img src={preview.url} alt="" className="h-20 w-full rounded-lg border border-border object-cover" />
              <figcaption className="mt-1 truncate text-[11px] text-muted-foreground">{preview.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
