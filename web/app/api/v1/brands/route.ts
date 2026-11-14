import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/api/http";
import { publicBrands } from "@/lib/catalogue";

export async function GET(request: Request) {
  const brands = await publicBrands();
  return NextResponse.json({
    data: brands.map((brand) => ({
      ...brand,
      image: absoluteUrl(request, brand.image),
    })),
  });
}
