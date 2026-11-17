"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";
import { showNotice } from "@/components/admin/notice-toast";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Feedback = { error?: string; field?: string } | null;

type FieldControlProps = {
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

export function ActionForm({ state, onReset, onKeyDown, ...props }: ComponentProps<"form"> & { state?: Feedback }) {
  const ref = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (!admin || !state?.error) return;
    showNotice("error", state.error);
  }, [admin, state]);

  useEffect(() => {
    const form = ref.current;
    if (!form || !state || state.error) return;
    form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
      input.value = "";
    });
  }, [state]);

  useEffect(() => {
    const form = ref.current;
    if (!form || !state?.error) return;
    const control = state.field ? findControl(form, state.field) : null;
    const banner = form.querySelector<HTMLElement>("[data-form-banner]");
    const target = control ?? banner;
    if (!target) return;
    const anchor = target.closest<HTMLElement>("[data-focus-anchor]") ?? target;
    target.focus({ preventScroll: true });
    anchor.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [state]);

  return (
    <form
      ref={ref}
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          const submitter = ref.current?.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled)');
          if (!ref.current || !submitter) return;
          event.preventDefault();
          ref.current.requestSubmit(submitter);
        }
      }}
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
    <p
      data-form-banner=""
      tabIndex={-1}
      role="alert"
      className="rounded-md text-sm text-destructive outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
    >
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

export function invalidProps(state: Feedback, name: string, describedBy?: string) {
  const invalid = Boolean(state?.error && state.field === name);
  const described = [invalid ? `${name}-error` : undefined, describedBy].filter(Boolean).join(" ");
  return {
    "aria-invalid": invalid || undefined,
    "aria-describedby": described || undefined,
  };
}

export function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}

export function FieldTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        aria-label={text}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-56 text-left leading-snug">{text}</TooltipContent>
    </Tooltip>
  );
}

export function FormField({
  label,
  name,
  state,
  hint,
  tooltip,
  required = false,
  className,
  children,
}: {
  label: ReactNode;
  name?: string;
  state?: Feedback;
  hint?: ReactNode;
  tooltip?: string;
  required?: boolean;
  className?: string;
  children: ReactElement<FieldControlProps>;
}) {
  const autoId = useId();
  if (!isValidElement<FieldControlProps>(children)) return children;
  const id = children.props.id || autoId;
  const invalid = Boolean(name && state?.error && state.field === name);
  const errorId = invalid && name ? `${name}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [children.props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined;
  const control = cloneElement(children, {
    id,
    required: children.props.required ?? (required || undefined),
    "aria-invalid": invalid || children.props["aria-invalid"] || undefined,
    "aria-describedby": describedBy,
  });

  return (
    <div className={cn("grid min-w-0 gap-1.5", className)} data-focus-anchor="">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>
          {label}
          {required ? <RequiredMark /> : null}
        </Label>
        {tooltip ? <FieldTip text={tooltip} /> : null}
      </div>
      {control}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {name ? <FieldIssue state={state ?? null} name={name} /> : null}
    </div>
  );
}

export function CheckField({ className, children, ...props }: ComponentProps<"input"> & { children: ReactNode }) {
  return (
    <label className={cn("flex items-start gap-2 text-sm", className)}>
      <input {...props} type="checkbox" className="pvrd-check mt-0.5" />
      <span>{children}</span>
    </label>
  );
}

function findControl(form: HTMLFormElement, field: string) {
  const escaped = CSS.escape(field);
  return (
    form.querySelector<HTMLElement>(`[data-field="${escaped}"]`) ??
    form.querySelector<HTMLElement>(`[name="${escaped}"]:not([type="hidden"])`)
  );
}
