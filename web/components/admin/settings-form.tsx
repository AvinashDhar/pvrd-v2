"use client";

import { useActionState, useEffect } from "react";
import { ActionForm, FormBanner, FormField } from "@/components/action-form";
import { showNotice } from "@/components/admin/notice-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { saveCompanySettings, type SettingsState } from "@/lib/actions/settings";
import type { CompanySettings } from "@/lib/db/company";

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [state, action, pending] = useActionState(saveCompanySettings, null as SettingsState);
  const logoUrl = state?.logoUrl === undefined ? settings.logoUrl : state.logoUrl;

  useEffect(() => {
    if (state && !state.error) showNotice("success", "Company settings saved.");
  }, [state]);

  return (
    <ActionForm className="pvrd-card max-w-3xl space-y-4 p-4 sm:p-6" action={action} state={state}>
      <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <FormField label="Company name" name="companyName" state={state} required>
          <Input name="companyName" autoComplete="organization" defaultValue={settings.companyName} maxLength={120} />
        </FormField>
        <FormField label="Tagline" name="tagline" state={state}>
          <Input name="tagline" defaultValue={settings.tagline} maxLength={160} />
        </FormField>
        <FormField label="Email" name="email" state={state}>
          <Input name="email" type="email" autoComplete="email" defaultValue={settings.email} maxLength={255} />
        </FormField>
        <FormField label="Contact number" name="phone" state={state}>
          <PhoneInput name="phone" autoComplete="tel" defaultValue={settings.phone} />
        </FormField>
        <FormField label="Website URL" name="website" state={state}>
          <Input name="website" type="url" autoComplete="url" defaultValue={settings.website} maxLength={255} />
        </FormField>
        <FormField label="Logo upload" name="logo" state={state}>
          <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
        </FormField>
      </div>
      {logoUrl ? (
        <img src={logoUrl} alt="Company logo" className="h-16 w-auto rounded-lg border border-border bg-white object-contain p-1" />
      ) : null}
      <FormField label="Address" name="address" state={state} hint="Enter adds a new line. Press Ctrl+Enter or ⌘+Enter to save.">
        <Textarea name="address" autoComplete="street-address" defaultValue={settings.address} maxLength={300} />
      </FormField>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <FormField label="Instagram" name="instagram" state={state}>
          <Input name="instagram" defaultValue={settings.instagram} maxLength={200} />
        </FormField>
        <FormField label="Facebook" name="facebook" state={state}>
          <Input name="facebook" defaultValue={settings.facebook} maxLength={200} />
        </FormField>
        <FormField label="YouTube" name="youtube" state={state}>
          <Input name="youtube" defaultValue={settings.youtube} maxLength={200} />
        </FormField>
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
