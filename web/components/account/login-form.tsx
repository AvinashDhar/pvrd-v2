"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PvrdLogo } from "@/components/admin/logo";
import { loginUser } from "@/lib/actions/account";

export function UserLoginForm({ notice, returnTo }: { notice?: string; returnTo?: string | null }) {
  const [state, action, pending] = useActionState(loginUser, null);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col xl:p-14">
        <Image src="/images/hero/showroom.jpg" alt="" fill priority sizes="55vw" className="object-cover" />
        <div className="absolute inset-0 bg-[#001F3D]/78" />
        <PvrdLogo size={72} className="relative z-10" />
        <div className="relative z-10 mt-auto max-w-md">
          <p className="text-sm tracking-[0.2em] text-lime uppercase">Retailers, contractors, consumers</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
            Sign in to your OM PVRD account.
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Keep your profile, and use the catalogue as a retailer, carpenter, or consumer.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-4 sm:p-6">
        <ActionForm className="pvrd-card w-full max-w-md space-y-4 p-5 sm:p-7" action={action} state={state}>
          <div className="lg:hidden">
            <PvrdLogo inverted className="mb-4" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              {returnTo
                ? "Retailer and carpenter accounts see the trade price after signing in."
                : "Use the mobile number or email on your account."}
            </p>
          </div>
          {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
          {notice ? <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-primary">{notice}</p> : null}
          <div className="grid gap-1.5">
            <Label htmlFor="identifier">Mobile or email</Label>
            <Input id="identifier" name="identifier" autoComplete="username" required maxLength={255} {...invalidProps(state, "identifier")} />
            <FieldIssue state={state} name="identifier" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} {...invalidProps(state, "password")} />
            <FieldIssue state={state} name="password" />
          </div>
          <FormBanner state={state} />
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href={returnTo ? `/signup?next=${encodeURIComponent(returnTo)}` : "/signup"} className="font-medium text-primary">
              Create an account
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login/admin" className="hover:underline">
              Administrator sign in
            </Link>
          </p>
        </ActionForm>
      </section>
    </div>
  );
}
