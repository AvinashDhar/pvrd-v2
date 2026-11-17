"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { PvrdLogo } from "@/components/admin/logo";
import { AccountBenefits } from "@/components/catalogue/account-benefits";
import { catalogueRoles } from "@/lib/auth/access";
import { signup } from "@/lib/actions/account";

export function SignupForm({ returnTo }: { returnTo?: string | null }) {
  const [state, action, pending] = useActionState(signup, null);

  return (
    <div className="safe-screen flex min-h-dvh items-center justify-center bg-background">
      <ActionForm className="pvrd-card w-full max-w-lg space-y-4 p-5 sm:p-7" action={action} state={state}>
        <PvrdLogo inverted />
        {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
        <AccountBenefits title="Create an account for these benefits" />
        <div>
          <h1 className="font-heading text-2xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Retailer, carpenter, and contractor accounts see the discounted trade price. Retailers and consumers can sign in immediately. Carpenter and contractor accounts wait for approval. Consumer accounts see MRP, and can still request a quotation and discuss it with OM PVRD.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={160} {...invalidProps(state, "name")} />
          <FieldIssue state={state} name="name" />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <PhoneInput id="mobile" name="mobile" mode="mobile" placeholder="10-digit mobile" required {...invalidProps(state, "mobile")} />
            <FieldIssue state={state} name="mobile" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" maxLength={255} {...invalidProps(state, "email")} />
            <FieldIssue state={state} name="email" />
          </div>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" autoComplete="address-level2" required minLength={2} maxLength={120} {...invalidProps(state, "city")} />
            <FieldIssue state={state} name="city" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="userType">Account type</Label>
            <select
              id="userType"
              name="userType"
              required
              defaultValue="retailer"
              className="pvrd-select bg-transparent"
              {...invalidProps(state, "userType")}
            >
              {catalogueRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <FieldIssue state={state} name="userType" />
          </div>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              {...invalidProps(state, "password")}
            />
            <FieldIssue state={state} name="password" />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              {...invalidProps(state, "confirm")}
            />
            <FieldIssue state={state} name="confirm" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="photo">Profile photo</Label>
          <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" {...invalidProps(state, "photo", "photo-hint")} />
          <FieldIssue state={state} name="photo" />
          <p id="photo-hint" className="text-xs text-muted-foreground">Optional. JPG, PNG, or WEBP, up to 2 MB.</p>
        </div>
        <FormBanner state={state} />
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href={returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login"} className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </ActionForm>
    </div>
  );
}
