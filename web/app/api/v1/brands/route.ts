import { NextResponse } from "next/server";
import { publicBrands } from "@/lib/catalogue";

export async function GET() {
  return NextResponse.json({ data: await publicBrands() });
}