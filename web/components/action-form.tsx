"use client";

import { useEffect, useRef, type ComponentProps } from "react";
type Feedback = { error?: string; field?: string } | null;

export function ActionForm({ state, onReset, ...props }: ComponentProps<"form"> & { state?: Feedback }) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = ref.current;
    if (!form || !state || state.error) return;
    form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
      input.value = "";
    });
  }, [state]);

  return (
    <form
      ref={ref}
      {...props}
      onReset={(event) => {
        // React resets the form when an action finishes, including after a validation error.
        event.preventDefault();
        onReset?.(event);
      }}
    />
  );
}

export function FormBanner({ state }: { state: Feedback }) {
  if (!state?.error || state.field) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function FieldIssue({ state, name }: { state: Feedback; name: string }) {
  if (!state?.error || state.field !== name) return null;
  return (
    <p id={`${name}-error`} role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function invalidProps(state: Feedback, name: string) {
  const invalid = Boolean(state?.error && state.field === name);
  return {
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${name}-error` : undefined,
  };
}
