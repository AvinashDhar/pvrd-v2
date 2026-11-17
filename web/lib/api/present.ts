import { absoluteUrl, requestAccount } from "@/lib/api/http";
import type { CatalogueAccount } from "@/lib/auth/session";
import { groupVariants, variantRowDetail, variantRowLabel, type CatalogueVariant } from "@/lib/catalogue/variants";
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
    images?: string[];
    variants: CatalogueVariant[];
  },
  trade: boolean,
  request: Request,
) {
  const specs = product.specs
    .filter((spec) => trade || !privateAttributeKeys.has(spec.key))
    .map(({ label, value }) => ({ label, value }));
  const variants = product.variants.map((variant) => {
    const image = absoluteUrl(request, variant.image);
    const shared = {
      id: variant.id ?? null,
      name: variant.name,
      finish: variant.finish,
      size: variant.size,
      image,
      mrp: variant.mrp,
      points: variant.points,
      packing: variant.packing,
      unit: variant.unit,
    };
    return trade ? { ...shared, price: variant.price } : shared;
  });
  const grouped = groupVariants(product.variants);
  const variantGroups = {
    groupBy: grouped.groupBy,
    groups: grouped.groups.map((group) => ({
      label: group.label,
      items: group.items.map((variant) => {
        const image = absoluteUrl(request, variant.image);
        const item = {
          id: variant.id ?? null,
          label: variantRowLabel(variant, grouped.groupBy),
          detail: variantRowDetail(variant, grouped.groupBy),
          name: variant.name,
          finish: variant.finish,
          size: variant.size,
          image,
          mrp: variant.mrp,
          points: variant.points,
          packing: variant.packing,
          unit: variant.unit,
        };
        return trade ? { ...item, price: variant.price } : item;
      }),
    })),
  };
  const images = (product.images?.length ? product.images : [product.image]).map(
    (src) => absoluteUrl(request, src) ?? src,
  );
  return {
    ...presentCard(product, trade, request),
    description: product.description,
    images,
    specs,
    displayRates: product.displayRates,
    variants,
    variantGroups,
  };
}
