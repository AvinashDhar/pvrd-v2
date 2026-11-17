"use client";

import { NotifyForm } from "@/components/admin/notify-form";
import type { ActionNotice } from "@/lib/forms";

export function ConfirmForm({
  action,
  message,
  children,
  id,
}: {
  action: (formData: FormData) => Promise<ActionNotice | void> | ActionNotice | void;
  message: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <NotifyForm id={id} action={action} confirm={message}>
      {children}
    </NotifyForm>
  );
}
