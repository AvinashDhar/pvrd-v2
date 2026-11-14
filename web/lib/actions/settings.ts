"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, settings } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth/session";
import { removeStoredImage, storeImage } from "@/lib/storage/images";
import { formError } from "@/lib/forms";

const optionalUrl = z.union([z.literal(""), z.string().trim().url()]);

const companySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(120),
  tagline: z.string().trim().max(160),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((value) => value === "" || /^[0-9+()\-\s]{6,40}$/.test(value), "Enter a valid contact number."),
  website: optionalUrl,
  address: z.string().trim().max(300),
  instagram: z.string().trim().max(200),
  facebook: z.string().trim().max(200),
  youtube: z.string().trim().max(200),
  logoUrl: z.string().trim().max(500),
});

export type SettingsState = { error?: string; field?: string; logoUrl?: string | null } | null;

export async function saveCompanySettings(_previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const session = await getAdminSession();
  if (!session) return formError("Sign in again to save settings.");

  const parsed = companySchema.safeParse({
    companyName: formData.get("companyName"),
    tagline: formData.get("tagline"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    address: formData.get("address"),
    instagram: formData.get("instagram"),
    facebook: formData.get("facebook"),
    youtube: formData.get("youtube"),
    logoUrl: formData.get("logoUrl") ?? "",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return formError(issue?.message ?? "Check the form and try again.", typeof field === "string" ? field : undefined);
  }

  const [existing] = await db.select({ logoKey: settings.logoKey }).from(settings).where(eq(settings.id, "company")).limit(1);
  let logoUrl = parsed.data.logoUrl || null;
  let logoKey = existing?.logoKey ?? null;
  const previousLogo = logoUrl;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const stored = await storeImage(logo, { folder: "company" });
      logoUrl = stored.url;
      logoKey = stored.key;
    } catch (error) {
      return formError(error instanceof Error ? error.message : "Logo upload failed.", "logo");
    }
  }

  const values = {
    companyName: parsed.data.companyName,
    tagline: parsed.data.tagline || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    website: parsed.data.website || null,
    address: parsed.data.address || null,
    logoUrl,
    logoKey,
    social: {
      instagram: parsed.data.instagram,
      facebook: parsed.data.facebook,
      youtube: parsed.data.youtube,
    },
  };

  await db
    .insert(settings)
    .values({ id: "company", ...values })
    .onDuplicateKeyUpdate({ set: values });

  if (previousLogo && previousLogo !== logoUrl) await removeStoredImage(previousLogo, existing?.logoKey);

  await db.insert(activityLogs).values({
    title: `${session.name} updated company settings`,
    entityType: "settings",
    entityId: "company",
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { logoUrl };
}
