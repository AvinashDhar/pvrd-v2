"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({
  viewHref,
  editHref,
}: {
  viewHref?: string;
  editHref?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {viewHref ? (
        <Button variant="ghost" size="icon-sm" render={<Link href={viewHref} />}>
          <Eye />
        </Button>
      ) : null}
      {editHref ? (
        <Button variant="ghost" size="icon-sm" render={<Link href={editHref} />}>
          <Pencil />
        </Button>
      ) : null}
      <Button variant="ghost" size="icon-sm" className="text-destructive">
        <Trash2 />
      </Button>
      <Button variant="ghost" size="icon-sm">
        <MoreHorizontal />
      </Button>
    </div>
  );
}
