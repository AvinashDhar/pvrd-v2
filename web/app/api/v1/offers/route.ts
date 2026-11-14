import { NextResponse } from "next/server";
import { listOfferRows, offerIsCurrent } from "@/lib/records";

export async function GET() {
  const offers = (await listOfferRows()).filter(offerIsCurrent);
  return NextResponse.json({
    data: offers.map((offer) => ({
      id: offer.id,
      name: offer.name,
      scope: offer.scope,
      type: offer.type,
      targetId: offer.targetId,
      startAt: offer.startAt,
      endAt: offer.endAt,
    })),
  });
}
