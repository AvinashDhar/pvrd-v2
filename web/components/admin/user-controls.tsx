"use client";

import { NotifyForm } from "@/components/admin/notify-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCatalogueUser, setUserStatus } from "@/lib/actions/users";

export function UserControls({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex min-w-[280px] flex-col gap-2">
      {status !== "active" ? (
        <NotifyForm action={setUserStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="active" />
          <Button type="submit" size="sm">
            {status === "pending" ? "Approve" : "Activate"}
          </Button>
        </NotifyForm>
      ) : (
        <NotifyForm action={setUserStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="inactive" />
          <Button type="submit" size="sm" variant="outline">
            Deactivate
          </Button>
        </NotifyForm>
      )}
      {status !== "blocked" ? (
        <NotifyForm action={setUserStatus} className="flex items-center gap-1">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="blocked" />
          <Input name="reason" aria-label="Block reason" placeholder="Block reason" required className="h-7" />
          <Button type="submit" size="sm" variant="destructive">
            Block
          </Button>
        </NotifyForm>
      ) : null}
      <NotifyForm action={deleteCatalogueUser} confirm="Delete this user? This cannot be undone.">
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="ghost">
          Delete
        </Button>
      </NotifyForm>
    </div>
  );
}
