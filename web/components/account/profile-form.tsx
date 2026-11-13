"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logoutUser, updateProfile } from "@/lib/actions/account";
import { roleLabel } from "@/lib/auth/access";
import { formatDate, formatDateTime } from "@/lib/format";
import { MediaImage } from "@/components/catalogue/media-image";

export function ProfileForm({
  account,
  saved,
}: {
  account: {
    name: string;
    email: string | null;
    mobile: string;
    userType: string;
    city: string | null;
    status: string;
    photoUrl: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  saved: boolean;
}) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Your profile</h1>
          <p className="text-sm text-muted-foreground">
            {roleLabel(account.userType)} · registered {formatDate(account.createdAt)}
            {account.lastLoginAt ? ` · last sign-in ${formatDateTime(account.lastLoginAt)}` : ""}
          </p>
        </div>
        <form action={logoutUser}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <form className="pvrd-card grid gap-4 p-5 sm:p-7" action={action}>
        {account.photoUrl ? (
          <MediaImage src={account.photoUrl} alt="" className="size-20 rounded-full" sizes="80px" />
        ) : null}
        {saved ? <p className="text-sm text-[#5f7a18]">Profile saved.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={account.name} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={account.mobile} readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={account.email ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={account.city ?? ""} required />
          </div>
          <div className="grid gap-1.5">
            <Label>Account type</Label>
            <Input value={roleLabel(account.userType)} readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Input value={account.status} readOnly className="capitalize" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="photo">Replace photo</Label>
          <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Leave the password fields blank to keep the current password.</p>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
