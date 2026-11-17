"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type NumberInputProps = ComponentProps<typeof Input> & {
  integer?: boolean;
};

export function NumberInput({ integer = false, onKeyDown, onBeforeInput, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) {
          onKeyDown?.(event);
          return;
        }
        if (event.key === "e" || event.key === "E" || event.key === "+" || (integer && (event.key === "." || event.key === ","))) {
          event.preventDefault();
        }
        onKeyDown?.(event);
      }}
      onBeforeInput={(event) => {
        const data = event.nativeEvent.data;
        if (data && data.length === 1 && (integer ? /\D/ : /[^\d.]/).test(data)) {
          event.preventDefault();
        }
        onBeforeInput?.(event);
      }}
      {...props}
    />
  );
}
