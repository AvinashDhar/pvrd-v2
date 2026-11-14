import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/api/http";
import { getCompanySettings } from "@/lib/db/company";

export async function GET(request: Request) {
  const settings = await getCompanySettings();
  return NextResponse.json({
    data: {
      companyName: settings.companyName,
      tagline: settings.tagline,
      email: settings.email,
      phone: settings.phone,
      website: settings.website,
      address: settings.address,
      logoUrl: absoluteUrl(request, settings.logoUrl),
      instagram: settings.instagram,
      facebook: settings.facebook,
      youtube: settings.youtube,
    },
  });
}
