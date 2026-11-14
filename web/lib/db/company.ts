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
  email: "",
  phone: "070047 27925",
  website: "https://ompvrd.com",
  address: "K D N SINGH GALI, Bye Pass Rd, Chas, Bokaro Steel City, Jharkhand 827013",
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
