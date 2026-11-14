"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateCatalogue, type CatalogueActionState } from "@/lib/actions/catalogues";

export function CatalogueActions({
  categoryId,
  name,
  activeProducts,
  hasPdf,
}: {
  categoryId: string;
  name: string;
  activeProducts: number;
  hasPdf: boolean;
}) {
  const [state, action, pending] = useActionState(generateCatalogue, null as CatalogueActionState);

  useEffect(() => {
    if (state && "ok" in state && state.ok) toast.success(`${name} catalogue is ready.`);
  }, [state, name]);

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <form action={action}>
          <input type="hidden" name="categoryId" value={categoryId} />
          <Button type="submit" size="sm" disabled={pending || activeProducts === 0}>
            {pending ? "Generating…" : hasPdf ? "Regenerate" : "Generate"}
          </Button>
        </form>
        {hasPdf ? (
          <>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`/api/catalogues/${categoryId}/download?view=1`} target="_blank" rel="noreferrer" />}
            >
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`/api/catalogues/${categoryId}/download`} />}
            >
              Download
            </Button>
          </>
        ) : null}
      </div>
      {activeProducts === 0 ? (
        <p className="text-xs text-muted-foreground">Add an active product before generating.</p>
      ) : null}
      {state && "error" in state ? (
        <p role="alert" className="max-w-xs text-xs text-destructive sm:text-right">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
