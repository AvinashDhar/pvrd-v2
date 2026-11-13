import { SettingsForm } from "@/components/admin/settings-form";
import { getCompanySettings } from "@/lib/db/company";

export default async function SettingsPage() {
  const settings = await getCompanySettings();
  return <SettingsForm key={`${settings.companyName}-${settings.logoUrl ?? ""}`} settings={settings} />;
}
