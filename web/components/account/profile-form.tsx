"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { ImageFileInput } from "@/components/admin/image-file-input";
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
  trade,
}: {
  trade: boolean;
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
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Your profile</h1>
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

      <div className="pvrd-card grid gap-3 p-5 sm:p-7">
        <p className="pvrd-kicker">Your benefits</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {trade
            ? "You are seeing discounted trade prices. Add sizes and quantities, request a quotation, then discuss it with OM PVRD."
            : "You can request a quotation and discuss it with OM PVRD. Discounted trade prices are for retailer, carpenter, and contractor accounts. This consumer account sees MRP."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/quotations/bucket" />} size="lg" className="h-12">
            Request quotation
          </Button>
          <Button render={<Link href="/quotations" />} variant="outline" size="lg" className="h-12">
            Discuss with OM PVRD
          </Button>
        </div>
      </div>

      <ActionForm className="pvrd-card grid gap-4 p-5 sm:p-7" action={action} state={state}>
        {account.photoUrl ? (
          <MediaImage src={account.photoUrl} alt="" className="size-20 rounded-full" sizes="80px" />
        ) : null}
        {saved ? <p role="status" className="text-sm text-[#5f7a18]">Profile saved.</p> : null}
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={account.name} required minLength={2} maxLength={160} {...invalidProps(state, "name")} />
            <FieldIssue state={state} name="name" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={account.mobile} readOnly />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={account.email ?? ""} maxLength={255} {...invalidProps(state, "email")} />
            <FieldIssue state={state} name="email" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={account.city ?? ""} required minLength={2} maxLength={120} {...invalidProps(state, "city")} />
            <FieldIssue state={state} name="city" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="userType">Account type</Label>
            <Input id="userType" value={roleLabel(account.userType)} readOnly />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Input id="status" value={account.status} readOnly className="capitalize" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="photo">Replace photo</Label>
          <ImageFileInput id="photo" name="photo" describedBy="photo-hint" invalid={state?.field === "photo"} />
          <p id="photo-hint" className="text-xs text-muted-foreground">JPG, PNG, or WEBP, up to 5 MB.</p>
          <FieldIssue state={state} name="photo" />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} {...invalidProps(state, "password", "password-hint")} />
            <FieldIssue state={state} name="password" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} {...invalidProps(state, "confirm", "password-hint")} />
            <FieldIssue state={state} name="confirm" />
          </div>
        </div>
        <p id="password-hint" className="text-xs text-muted-foreground">Leave the password fields blank to keep the current password.</p>
        <FormBanner state={state} />
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </ActionForm>
    </div>
  );
}
