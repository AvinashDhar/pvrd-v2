"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCatalogueUser, setUserStatus } from "@/lib/actions/users";

export function UserControls({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex min-w-[280px] flex-col gap-2">
      {status !== "active" ? (
        <form action={setUserStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="active" />
          <Button type="submit" size="sm">
            {status === "pending" ? "Approve" : "Activate"}
          </Button>
        </form>
      ) : (
        <form action={setUserStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="inactive" />
          <Button type="submit" size="sm" variant="outline">
            Deactivate
          </Button>
        </form>
      )}
      {status !== "blocked" ? (
        <form action={setUserStatus} className="flex items-center gap-1">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="blocked" />
          <Input name="reason" placeholder="Block reason" required className="h-7" />
          <Button type="submit" size="sm" variant="destructive">
            Block
          </Button>
        </form>
      ) : null}
      <form
        action={deleteCatalogueUser}
        onSubmit={(event) => {
          if (!window.confirm("Delete this user? This cannot be undone.")) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="ghost">
          Delete
        </Button>
      </form>
    </div>
  );
}
