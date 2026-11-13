import { NextResponse } from "next/server";
import { publicCategories } from "@/lib/catalogue";

export async function GET() {
  return NextResponse.json({ data: await publicCategories() });
}
