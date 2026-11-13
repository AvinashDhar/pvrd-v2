import { NextResponse } from "next/server";
import { publicProducts } from "@/lib/catalogue";

export async function GET() {
  return NextResponse.json({
    data: await publicProducts(),
    nextCursor: null,
  });
}
