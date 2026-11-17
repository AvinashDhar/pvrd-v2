/** Retailer and carpenter accounts see the dealer rate. Consumers stay on MRP. */
export function isTradeAccount(userType: string | null | undefined) {
  return userType === "retailer" || userType === "contractor";
}

/** Labels and explanations for the two stored amounts. Keyed by product field. */
export const pricingFieldHelp = {
  mrp: {
    label: "MRP",
    tooltip: "Public retail price. Guests and consumers see this on the catalogue.",
  },
  price: {
    label: "Trade price",
    tooltip: "Dealer rate. Only signed-in retailers and carpenters see this.",
  },
} as const;

export function pricingFieldLabel(key: string, fallback: string) {
  if (key === "mrp" || key === "price") return pricingFieldHelp[key].label;
  return fallback;
}

export function moneyAmount(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/** Same-site path to return to after sign-in. Rejects other hosts and auth screens. */
export function catalogueReturnPath(value: FormDataEntryValue | string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) return null;
  let url: URL;
  try {
    url = new URL(raw, "http://pvrd.local");
  } catch {
    return null;
  }
  if (url.origin !== "http://pvrd.local") return null;
  const path = decodeURIComponent(url.pathname);
  if (path.startsWith("//") || path.includes("\\")) return null;
  if (path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/admin") || path.startsWith("/api")) {
    return null;
  }
  return `${url.pathname}${url.search}`;
}
