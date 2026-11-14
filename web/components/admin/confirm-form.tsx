"use client";

export function ConfirmForm({
  action,
  message,
  children,
  id,
}: {
  action: (formData: FormData) => void;
  message: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <form
      id={id}
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
