export const categoryImages: Record<string, string> = {
  "curtain-brackets": "/images/categories/curtains.jpg",
  "door-aldrop": "/images/categories/door.jpg",
  "door-handles": "/images/categories/interior.jpg",
  "door-kits": "/images/products/door-kit.jpg",
  "door-hinges": "/images/categories/metal.jpg",
  "door-fittings": "/images/categories/living-room.jpg",
  "door-interlocks": "/images/categories/smart-lock.jpg",
  "tower-bolts": "/images/products/tower-bolt.jpg",
  "glass-fittings": "/images/categories/glass.jpg",
  "mortise-handles": "/images/products/mortise.jpg",
  "kitchen-baskets": "/images/categories/kitchen.jpg",
  "modular-kitchen-accessories": "/images/categories/mod-kitchen.jpg",
  "cabinet-handles": "/images/products/cabinet-handle.jpg",
  "profile-pipes": "/images/categories/pipes.jpg",
  "wardrobe-fittings": "/images/categories/wardrobe.jpg",
  "telescopic-channel": "/images/products/channel.jpg",
  "edge-bindings": "/images/categories/cabinet.jpg",
  "castor-wheels": "/images/categories/tools.jpg",
  locks: "/images/categories/lock.jpg",
  "bathroom-fittings": "/images/categories/bathroom.jpg",
  "aluminium-products": "/images/categories/aluminium.jpg",
  "screws-carriage-bolts": "/images/categories/bolts.jpg",
  miscellaneous: "/images/categories/screws.jpg",
};

export const fallbackImage = "/images/categories/tools.jpg";

export function imageForCategory(slug: string) {
  return categoryImages[slug] ?? fallbackImage;
}
