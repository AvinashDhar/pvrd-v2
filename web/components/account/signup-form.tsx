"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PvrdLogo } from "@/components/admin/logo";
import { catalogueRoles } from "@/lib/auth/access";
import { signup } from "@/lib/actions/account";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
      <form className="pvrd-card w-full max-w-lg space-y-4 p-5 sm:p-7" action={action}>
        <PvrdLogo inverted />
        <div>
          <h1 className="font-heading text-2xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Retailers and consumers can sign in immediately. Carpenter and contractor accounts wait for approval.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" name="mobile" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" autoComplete="address-level2" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="userType">Account type</Label>
            <select
              id="userType"
              name="userType"
              required
              defaultValue="retailer"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {catalogueRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="photo">Profile photo</Label>
          <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          <p className="text-xs text-muted-foreground">Optional. JPG, PNG, or WEBP, up to 2 MB.</p>
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
