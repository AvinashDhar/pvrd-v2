"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PvrdLogo } from "@/components/admin/logo";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col xl:p-14">
        <Image
          src="/images/hero/showroom.jpg"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#001F3D]/78" />
        <PvrdLogo size={72} className="relative z-10" />
        <div className="relative z-10 mt-auto max-w-md">
          <p className="text-sm tracking-[0.2em] text-lime uppercase">Administrator</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
            Manage the OM PVRD catalogue from one quiet, fast workspace.
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Contractor rates, loyalty, products and campaigns — designed for hardware teams.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-4 sm:p-6">
        <form className="pvrd-card w-full max-w-md space-y-4 p-5 sm:p-7" action={action}>
          <div className="lg:hidden">
            <PvrdLogo inverted className="mb-4" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold">Administrator sign in</h2>
            <p className="text-sm text-muted-foreground">This entrance is only for the admin panel.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Signing in…" : "Enter admin panel"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Catalogue account?{" "}
            <Link href="/login" className="font-medium text-primary">
              Sign in here
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
