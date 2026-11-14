"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type PhoneInputProps = ComponentProps<typeof Input> & {
  mode?: "mobile" | "phone";
};

export function PhoneInput({ mode = "phone", onChange, onBeforeInput, ...props }: PhoneInputProps) {
  const mobile = mode === "mobile";
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={mobile ? 10 : 40}
      pattern={mobile ? "[6-9][0-9]{9}" : "[0-9+() \\-]{6,40}"}
      title={mobile ? "Enter a 10-digit mobile number starting with 6, 7, 8, or 9" : "Use digits and phone characters only"}
      onBeforeInput={(event) => {
        const data = event.nativeEvent.data;
        if (data && data.length === 1 && !(mobile ? /[0-9]/ : /[0-9+()\-\s]/).test(data)) {
          event.preventDefault();
        }
        onBeforeInput?.(event);
      }}
      onChange={(event) => {
        const next = mobile ? indianMobile(event.target.value) : phoneChars(event.target.value);
        if (event.target.value !== next) event.target.value = next;
        onChange?.(event);
      }}
      {...props}
    />
  );
}

function phoneChars(value: string) {
  return value.replace(/[^0-9+()\-\s]/g, "").slice(0, 40);
}

function indianMobile(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
}
