"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCompanySettings, type SettingsState } from "@/lib/actions/settings";
import type { CompanySettings } from "@/lib/db/company";

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [state, action, pending] = useActionState(saveCompanySettings, null as SettingsState);
  const logoUrl = state?.logoUrl === undefined ? settings.logoUrl : state.logoUrl;

  useEffect(() => {
    if (state && !state.error) toast.success("Company settings saved.");
  }, [state]);

  return (
    <form className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6" action={action}>
      <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <Input name="companyName" defaultValue={settings.companyName} required />
        </Field>
        <Field label="Tagline">
          <Input name="tagline" defaultValue={settings.tagline} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={settings.email} />
        </Field>
        <Field label="Contact number">
          <Input name="phone" defaultValue={settings.phone} />
        </Field>
        <Field label="Website URL">
          <Input name="website" defaultValue={settings.website} />
        </Field>
        <Field label="Logo upload">
          <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
        </Field>
      </div>
      {logoUrl ? (
        <img src={logoUrl} alt="Company logo" className="h-16 w-auto rounded-lg border border-border bg-white object-contain p-1" />
      ) : null}
      <Field label="Address">
        <Textarea name="address" defaultValue={settings.address} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Instagram">
          <Input name="instagram" defaultValue={settings.instagram} />
        </Field>
        <Field label="Facebook">
          <Input name="facebook" defaultValue={settings.facebook} />
        </Field>
        <Field label="YouTube">
          <Input name="youtube" defaultValue={settings.youtube} />
        </Field>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
