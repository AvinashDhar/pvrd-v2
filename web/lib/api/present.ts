import { absoluteUrl, requestAccount } from "@/lib/api/http";
import type { CatalogueAccount } from "@/lib/auth/session";
import { isTradeAccount } from "@/lib/pricing";

const privateAttributeKeys = new Set(["price", "contractorDiscount", "consumerDiscount"]);

type Card = {
  id: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  mrp: number;
  image: string;
  sku: string;
};

export function viewerIsTrade(account: CatalogueAccount | null) {
  return isTradeAccount(account?.userType);
}

export async function catalogueViewer(request: Request) {
  const access = await requestAccount(request);
  if (access.response) return { response: access.response, trade: false };
  return { response: null, trade: viewerIsTrade(access.account) };
}

export function presentCard(card: Card, trade: boolean, request: Request) {
  const image = absoluteUrl(request, card.image) ?? card.image;
  if (!trade) {
    return {
      id: card.id,
      name: card.name,
      brand: card.brand,
      category: card.category,
      categorySlug: card.categorySlug,
      mrp: card.mrp,
      image,
      sku: card.sku,
    };
  }
  return { ...card, image };
}

export function presentProduct(
  product: Card & {
    description: string | null;
    specs: { key: string; label: string; value: string }[];
    displayRates: { label: string; formula: string; value: string | null }[];
    variants: {
      name: string;
      finish: string | null;
      size: string | null;
      price: string | null;
      image: string | null;
      mrp: string;
      points: string;
    }[];
  },
  trade: boolean,
  request: Request,
) {
  const specs = product.specs
    .filter((spec) => trade || !privateAttributeKeys.has(spec.key))
    .map(({ label, value }) => ({ label, value }));
  const variants = product.variants.map((variant) => {
    const image = absoluteUrl(request, variant.image);
    if (!trade) {
      return {
        name: variant.name,
        finish: variant.finish,
        size: variant.size,
        image,
        mrp: variant.mrp,
        points: variant.points,
      };
    }
    return { ...variant, image };
  });
  return {
    ...presentCard(product, trade, request),
    description: product.description,
    specs,
    displayRates: product.displayRates,
    variants,
  };
}
