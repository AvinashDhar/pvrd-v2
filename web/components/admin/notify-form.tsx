"use client";

import { useActionState, useEffect, useRef, type ComponentProps, type SubmitEvent } from "react";
import { beginAppNavigation, endAppNavigation } from "@/components/brand/navigation-signal";
import { showNotice } from "@/components/admin/notice-toast";
import type { ActionNotice } from "@/lib/forms";

export function NotifyForm({
  action,
  confirm,
  children,
  onSubmit,
  onReset,
  ...props
}: Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => Promise<ActionNotice | void> | ActionNotice | void;
  confirm?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const externalSubmitter = useRef<HTMLButtonElement | null>(null);
  const [state, formAction] = useActionState(async (_previous: ActionNotice | null, formData: FormData) => {
    const result = await action(formData);
    return result ?? null;
  }, null);

  useEffect(() => {
    if (!state) return;
    const submitter = externalSubmitter.current;
    if (submitter) {
      if (state.error) {
        submitter.disabled = false;
        submitter.removeAttribute("aria-busy");
      }
      externalSubmitter.current = null;
      endAppNavigation();
    }
    if (state.error) {
      showNotice("error", state.error);
      return;
    }
    if (!state.message) return;
    showNotice("success", state.message);
    ref.current?.querySelectorAll("textarea").forEach((field) => {
      field.value = "";
    });
  }, [state]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    if (confirm && !window.confirm(confirm)) {
      event.preventDefault();
      return;
    }
    const submitter = event.submitter;
    if (submitter instanceof HTMLButtonElement && submitter.form !== event.currentTarget) {
      externalSubmitter.current = submitter;
      submitter.disabled = true;
      submitter.setAttribute("aria-busy", "true");
      beginAppNavigation();
    }
  }

  return (
    <form
      ref={ref}
      {...props}
      action={formAction}
      onSubmit={handleSubmit}
      onReset={(event) => {
        event.preventDefault();
        onReset?.(event);
      }}
    >
      {children}
    </form>
  );
}
