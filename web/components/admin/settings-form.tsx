"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { ActionForm, FieldIssue, FormBanner, invalidProps } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
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
    <ActionForm className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6" action={action} state={state}>
      <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Company name" state={state} name="companyName">
          <Input name="companyName" defaultValue={settings.companyName} required maxLength={120} {...invalidProps(state, "companyName")} />
        </Field>
        <Field label="Tagline" state={state} name="tagline">
          <Input name="tagline" defaultValue={settings.tagline} maxLength={160} {...invalidProps(state, "tagline")} />
        </Field>
        <Field label="Email" state={state} name="email">
          <Input name="email" type="email" defaultValue={settings.email} maxLength={255} {...invalidProps(state, "email")} />
        </Field>
        <Field label="Contact number" state={state} name="phone">
          <PhoneInput name="phone" defaultValue={settings.phone} {...invalidProps(state, "phone")} />
        </Field>
        <Field label="Website URL" state={state} name="website">
          <Input name="website" type="url" defaultValue={settings.website} maxLength={255} {...invalidProps(state, "website")} />
        </Field>
        <Field label="Logo upload" state={state} name="logo">
          <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp" {...invalidProps(state, "logo")} />
        </Field>
      </div>
      {logoUrl ? (
        <img src={logoUrl} alt="Company logo" className="h-16 w-auto rounded-lg border border-border bg-white object-contain p-1" />
      ) : null}
      <Field label="Address" state={state} name="address">
        <Textarea name="address" defaultValue={settings.address} maxLength={300} {...invalidProps(state, "address")} />
      </Field>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <Field label="Instagram" state={state} name="instagram">
          <Input name="instagram" defaultValue={settings.instagram} maxLength={200} {...invalidProps(state, "instagram")} />
        </Field>
        <Field label="Facebook" state={state} name="facebook">
          <Input name="facebook" defaultValue={settings.facebook} maxLength={200} {...invalidProps(state, "facebook")} />
        </Field>
        <Field label="YouTube" state={state} name="youtube">
          <Input name="youtube" defaultValue={settings.youtube} maxLength={200} {...invalidProps(state, "youtube")} />
        </Field>
      </div>
      <FormBanner state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </ActionForm>
  );
}

function Field({
  label,
  name,
  state,
  children,
}: {
  label: string;
  name?: string;
  state?: { error?: string; field?: string } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label>{label}</Label>
      {children}
      {name ? <FieldIssue state={state ?? null} name={name} /> : null}
    </div>
  );
}
