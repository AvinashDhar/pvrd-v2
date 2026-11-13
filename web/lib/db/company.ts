import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, type CompanySocial } from "@/lib/db/schema";

export type CompanySettings = {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logoUrl: string | null;
  instagram: string;
  facebook: string;
  youtube: string;
};

export const defaultCompanySettings: CompanySettings = {
  companyName: "OM PVRD",
  tagline: "Premium Hardware Fittings",
  email: "hello@ompvrd.com",
  phone: "+91 79 4000 1200",
  website: "https://ompvrd.com",
  address: "14, Hardware Market, Ahmedabad, Gujarat",
  logoUrl: null,
  instagram: "https://instagram.com/ompvrd",
  facebook: "https://facebook.com/ompvrd",
  youtube: "https://youtube.com/@ompvrd",
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const [row] = await db.select().from(settings).where(eq(settings.id, "company")).limit(1);
  if (!row) return defaultCompanySettings;

  const social = (row.social ?? {}) as CompanySocial;
  return {
    companyName: row.companyName,
    tagline: row.tagline ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    address: row.address ?? "",
    logoUrl: row.logoUrl,
    instagram: social.instagram ?? "",
    facebook: social.facebook ?? "",
    youtube: social.youtube ?? "",
  };
}
