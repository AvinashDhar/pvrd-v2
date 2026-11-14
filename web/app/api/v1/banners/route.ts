import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/api/http";
import { bannerTypes, listPublicBanners, type BannerType } from "@/lib/banners/queries";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("type")?.trim() || "homepage";
  const type = bannerTypes.includes(requested as BannerType) ? (requested as BannerType) : "homepage";
  const banners = await listPublicBanners(type);
  return NextResponse.json({
    data: banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      image: absoluteUrl(request, banner.imageUrl),
      type: banner.type,
      linkType: banner.linkType,
      linkId: banner.linkId,
      redirectUrl: banner.redirectUrl,
    })),
  });
}
