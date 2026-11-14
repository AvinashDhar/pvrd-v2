import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/api/http";
import { publicCategories } from "@/lib/catalogue";

export async function GET(request: Request) {
  const categories = await publicCategories();
  return NextResponse.json({
    data: categories.map((category) => ({
      ...category,
      image: absoluteUrl(request, category.image),
    })),
  });
}
