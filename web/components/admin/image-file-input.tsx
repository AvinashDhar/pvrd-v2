"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, validateImageFile } from "@/lib/storage/upload-limits";

function assignFile(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  const transfer = new DataTransfer();
  if (file) transfer.items.add(file);
  input.files = transfer.files;
}

export function ImageFileInput({
  id,
  name,
  required,
  invalid,
  describedBy,
  className,
}: {
  id?: string;
  name: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-size-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const showInvalid = invalid || Boolean(localError);

  function onPick(list: FileList | null) {
    const file = list?.[0] && list[0].size > 0 ? list[0] : null;
    if (inputRef.current) inputRef.current.value = "";

    if (!file) {
      assignFile(inputRef.current, null);
      setLocalError(null);
      return;
    }

    const message = validateImageFile(file, MAX_IMAGE_BYTES);
    if (message) {
      assignFile(inputRef.current, null);
      setLocalError(message);
      return;
    }

    assignFile(inputRef.current, file);
    setLocalError(null);
  }

  return (
    <div className="grid gap-1.5">
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        required={required}
        aria-invalid={showInvalid || undefined}
        aria-describedby={[describedBy, localError ? errorId : null].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:h-9 md:text-sm",
          className,
        )}
        onChange={(event) => onPick(event.target.files)}
      />
      {localError ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
