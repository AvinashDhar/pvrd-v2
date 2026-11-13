export type FieldType =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "image"
  | "checkbox";

export type CategoryField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  copyFromParent?: boolean;
};

export type CategorySchema = {
  slug: string;
  name: string;
  fields: CategoryField[];
  variantFields: CategoryField[];
  displayFormula?: string;
};

const commonPricing: CategoryField[] = [
  { key: "image", label: "Upload Photo", type: "image", required: true },
  { key: "brand", label: "Brand", type: "select", required: true },
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "sku", label: "SKU / Product Code", type: "text", required: false },
  { key: "mrp", label: "MRP", type: "number", required: true },
  { key: "price", label: "Price", type: "number", required: true },
  { key: "contractorDiscount", label: "Contractor Discount", type: "number", required: true },
  { key: "consumerDiscount", label: "Consumer Discount", type: "number", required: true },
  { key: "points", label: "Points", type: "number", required: false },
  { key: "description", label: "Description", type: "textarea", required: false },
];

function withCommon(extra: CategoryField[] = []): CategoryField[] {
  const keys = new Set(extra.map((f) => f.key));
  return [...commonPricing.filter((f) => !keys.has(f.key)), ...extra];
}

export const categorySchemas: CategorySchema[] = [
  {
    slug: "curtain-brackets",
    name: "Curtain Brackets",
    fields: withCommon([{ key: "finish", label: "Finish", type: "select", required: true }]),
    variantFields: [
      { key: "image", label: "Image", type: "image", required: true },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "price", label: "Price", type: "number", required: true, copyFromParent: true },
    ],
  },
  {
    slug: "door-aldrop",
    name: "Door Aldrop",
    displayFormula: "Rod Length × Rod Diameter × Plate Thickness",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "rodLength", label: "Rod Length", type: "number", required: true },
      { key: "rodDiameter", label: "Rod Diameter", type: "number", required: true },
      { key: "plateThickness", label: "Plate Thickness", type: "number", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "size", label: "Size", type: "text", required: true, copyFromParent: true },
      { key: "price", label: "Price", type: "number", required: true, copyFromParent: true },
    ],
  },
  {
    slug: "door-handles",
    name: "Door Handles",
    displayFormula: "Plate Length × Plate Width × Plate Thickness",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "plateLength", label: "Plate Length", type: "number", required: true },
      { key: "plateWidth", label: "Plate Width", type: "number", required: true },
      { key: "plateThickness", label: "Plate Thickness", type: "number", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "size", label: "Size", type: "text", required: true, copyFromParent: true },
      { key: "price", label: "Price", type: "number", required: true, copyFromParent: true },
    ],
  },
  {
    slug: "door-kits",
    name: "Door Kits",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "aldrop", label: "Aldrop", type: "text", required: true },
      { key: "rodLength", label: "Rod Length", type: "number", required: true },
      { key: "rodDiameter", label: "Rod Diameter", type: "number", required: true },
      { key: "handle", label: "Handle (2 pcs)", type: "text", required: true },
      { key: "doorStopper", label: "Door Stopper", type: "text", required: false },
      { key: "towerBolt", label: "Tower Bolt", type: "text", required: false },
      { key: "weight", label: "Weight of Products", type: "number", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "door-hinges",
    name: "Door Hinges",
    fields: withCommon([
      { key: "length", label: "Length", type: "number", required: true },
      { key: "thickness", label: "Thickness", type: "number", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: false },
      { key: "finish", label: "Finish", type: "select", required: false },
      { key: "price", label: "Price", type: "number", required: false },
    ],
  },
  {
    slug: "door-fittings",
    name: "Door Fittings",
    fields: withCommon([
      { key: "finish", label: "Finish", type: "select", required: false },
      { key: "size", label: "Size", type: "text", required: false },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "mrp", label: "MRP", type: "number", required: true },
      { key: "price", label: "Price", type: "number", required: true },
    ],
  },
  {
    slug: "door-interlocks",
    name: "Door Interlocks",
    fields: withCommon([
      { key: "warranty", label: "Guarantee / Warranty", type: "text", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "price", label: "Price", type: "number", required: true },
    ],
  },
  {
    slug: "tower-bolts",
    name: "Tower Bolts",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "price", label: "Price", type: "number", required: true },
    ],
  },
  {
    slug: "glass-fittings",
    name: "Glass Fittings",
    fields: withCommon(),
    variantFields: [],
  },
  {
    slug: "mortise-handles",
    name: "Mortise Handles",
    fields: withCommon([
      { key: "warranty", label: "Guarantee / Warranty", type: "text", required: true },
      { key: "size", label: "Size", type: "text", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "kitchen-baskets",
    name: "Kitchen Baskets",
    fields: withCommon([
      { key: "warranty", label: "Guarantee / Warranty", type: "text", required: true },
      { key: "size", label: "Size (W × D × H)", type: "text", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "modular-kitchen-accessories",
    name: "Modular Kitchen Accessories",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "cabinet-handles",
    name: "Cabinet Handles",
    fields: withCommon([
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "size", label: "Size", type: "text", required: true },
    ]),
    variantFields: [
      { key: "size", label: "Size", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "image", label: "Image", type: "image", required: true },
      { key: "mrp", label: "MRP", type: "number", required: true },
      { key: "price", label: "Price", type: "number", required: true },
      { key: "points", label: "Points", type: "number", required: false },
    ],
  },
  {
    slug: "profile-pipes",
    name: "Profile & Pipes",
    fields: withCommon([
      { key: "brand", label: "Brand", type: "select", required: false },
      { key: "size", label: "Size", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "price", label: "Price", type: "number", required: true },
    ],
  },
  {
    slug: "wardrobe-fittings",
    name: "Wardrobe Fittings",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: false },
    ]),
    variantFields: [],
  },
  {
    slug: "telescopic-channel",
    name: "Telescopic Channel",
    fields: withCommon([{ key: "size", label: "Size", type: "text", required: true }]),
    variantFields: [],
  },
  {
    slug: "edge-bindings",
    name: "Edge Bindings",
    fields: withCommon([
      { key: "shadeName", label: "Shade Name", type: "text", required: true },
      { key: "finish", label: "Finish", type: "select", required: true },
      { key: "size", label: "Size", type: "text", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "castor-wheels",
    name: "Castor Wheels",
    fields: withCommon([{ key: "size", label: "Size", type: "text", required: true }]),
    variantFields: [],
  },
  {
    slug: "locks",
    name: "Locks",
    fields: withCommon(),
    variantFields: [],
  },
  {
    slug: "bathroom-fittings",
    name: "Bathroom Fittings",
    fields: withCommon([
      { key: "name", label: "Name", type: "text", required: true },
      { key: "size", label: "Size", type: "text", required: false },
    ]),
    variantFields: [],
  },
  {
    slug: "aluminium-products",
    name: "Aluminium Products",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "screws-carriage-bolts",
    name: "Screws & Carriage Bolts",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [],
  },
  {
    slug: "miscellaneous",
    name: "Miscellaneous Products",
    fields: withCommon([
      { key: "weight", label: "Weight", type: "number", required: true },
      { key: "size", label: "Size", type: "text", required: false },
      { key: "finish", label: "Finish", type: "select", required: false },
    ]),
    variantFields: [],
  },
];
