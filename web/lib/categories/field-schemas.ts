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
  group?: string;
};

export type CategorySchema = {
  slug: string;
  name: string;
  fields: CategoryField[];
  variantFields: CategoryField[];
};

/** Bump when built-in category fields change so stored schemas are refreshed once. */
export const BUILTIN_SCHEMA_VERSION = 4;

export const finishOptions = [
  "SS",
  "Antique Brass",
  "Black Matt",
  "Gold",
  "Rose Gold",
  "Chrome",
  "Nickel",
  "Copper",
  "Graphite",
  "White",
  "Ivory",
];

function finish(required: boolean): CategoryField {
  return { key: "finish", label: "Finish", type: "select", required, options: finishOptions };
}

function variantRates(required = true): CategoryField[] {
  return [
    { key: "mrp", label: "MRP", type: "number", required },
    { key: "price", label: "Trade price", type: "number", required },
    { key: "contractorDiscount", label: "Contractor Discount", type: "number", required },
    { key: "consumerDiscount", label: "Consumer Discount", type: "number", required },
  ];
}

export function builtinFieldSchema(schema: CategorySchema) {
  return {
    schemaVersion: BUILTIN_SCHEMA_VERSION,
    fields: schema.fields,
  };
}

const commonPricing: CategoryField[] = [
  { key: "image", label: "Upload Photo", type: "image", required: true },
  { key: "brand", label: "Brand", type: "select", required: true },
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "sku", label: "SKU / Product Code", type: "text", required: false },
  { key: "mrp", label: "MRP", type: "number", required: true },
  { key: "price", label: "Trade price", type: "number", required: true },
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
    fields: withCommon([finish(true)]),
    variantFields: [
      { key: "image", label: "Upload Image", type: "image", required: true },
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      { key: "price", label: "Trade price", type: "number", required: true, copyFromParent: true },
    ],
  },
  {
    slug: "door-aldrop",
    name: "Door Aldrop",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "rodLength", label: "Rod Length", type: "number", required: true },
      { key: "rodDiameter", label: "Rod Diameter", type: "number", required: true },
      { key: "plateThickness", label: "Plate Thickness", type: "number", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      { key: "size", label: "Size", type: "text", required: true, copyFromParent: true },
      { key: "price", label: "Trade price", type: "number", required: true, copyFromParent: true },
    ],
  },
  {
    slug: "door-handles",
    name: "Door Handles",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "plateLength", label: "Plate Length", type: "number", required: true },
      { key: "plateWidth", label: "Plate Width", type: "number", required: true },
      { key: "plateThickness", label: "Plate Thickness", type: "number", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      { key: "size", label: "Size", type: "text", required: true, copyFromParent: true },
      { key: "price", label: "Trade price", type: "number", required: true, copyFromParent: true },
    ],
  },
  {
    slug: "door-kits",
    name: "Door Kits",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      { key: "aldrop", label: "Aldrop", type: "text", required: true, group: "Aldrop" },
      { key: "aldropRodLength", label: "Rod Length", type: "number", required: true, group: "Aldrop" },
      { key: "aldropRodDiameter", label: "Rod Diameter", type: "number", required: true, group: "Aldrop" },
      { key: "aldropPlateThickness", label: "Plate Thickness", type: "number", required: true, group: "Aldrop" },
      { key: "handle", label: "Handle (2 pcs)", type: "text", required: true, group: "Handle" },
      { key: "handlePlateLength", label: "Plate Length", type: "number", required: true, group: "Handle" },
      { key: "handlePlateWidth", label: "Plate Width", type: "number", required: true, group: "Handle" },
      { key: "handlePlateThickness", label: "Plate Thickness", type: "number", required: true, group: "Handle" },
      { key: "doorStopper", label: "Door Stopper", type: "text", required: true, group: "Door stopper" },
      { key: "doorStopperName", label: "Name", type: "text", required: true, group: "Door stopper" },
      { key: "towerBolt", label: "Tower Bolt", type: "text", required: true, group: "Tower bolt" },
      { key: "towerBoltSize", label: "Size", type: "text", required: true, group: "Tower bolt" },
      { key: "latch", label: "Latch", type: "text", required: true, group: "Latch" },
      { key: "latchRodLength", label: "Rod Length", type: "number", required: true, group: "Latch" },
      { key: "latchRodDiameter", label: "Rod Diameter", type: "number", required: true, group: "Latch" },
      { key: "latchPlateThickness", label: "Plate Thickness", type: "number", required: true, group: "Latch" },
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
      finish(false),
      { key: "price", label: "Trade price", type: "number", required: false },
    ],
  },
  {
    slug: "door-fittings",
    name: "Door Fittings",
    fields: withCommon([
      finish(false),
      { key: "size", label: "Size", type: "text", required: false },
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      ...variantRates(),
    ],
  },
  {
    slug: "door-interlocks",
    name: "Door Interlocks",
    fields: withCommon([
      { key: "warranty", label: "Guarantee / Warranty", type: "text", required: true },
      { key: "weight", label: "Weight", type: "number", required: true },
      finish(true),
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      ...variantRates(),
    ],
  },
  {
    slug: "tower-bolts",
    name: "Tower Bolts",
    fields: withCommon([
      { key: "size", label: "Size", type: "text", required: true },
      finish(true),
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      ...variantRates(),
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
      finish(true),
    ]),
    variantFields: [],
  },
  {
    slug: "cabinet-handles",
    name: "Cabinet Handles",
    fields: withCommon([
      finish(true),
      { key: "size", label: "Size", type: "text", required: true },
    ]),
    variantFields: [
      { key: "size", label: "Size", type: "text", required: true },
      finish(true),
      { key: "image", label: "Product Image", type: "image", required: true },
      ...variantRates(),
      { key: "points", label: "Points", type: "number", required: false },
    ],
  },
  {
    slug: "profile-pipes",
    name: "Profile & Pipes",
    fields: withCommon([
      { key: "brand", label: "Brand", type: "select", required: false },
      { key: "size", label: "Size", type: "text", required: true },
      finish(true),
      { key: "weight", label: "Weight", type: "number", required: true },
    ]),
    variantFields: [
      { key: "name", label: "Name", type: "text", required: true },
      finish(true),
      ...variantRates(),
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
      finish(true),
      { key: "size", label: "Size", type: "text", required: true },
      { key: "consumerDiscount", label: "Discount for Dealers", type: "number", required: true },
    ]).filter((field) => field.key !== "price"),
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
      finish(false),
    ]),
    variantFields: [],
  },
];
