import { eq } from "drizzle-orm";
import { loadEnvLocal } from "./load-env";

loadEnvLocal();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in web/.env.local before seeding.");
  }

  const { db } = await import("./index");
  const { admins, settings } = await import("./schema");
  const { hashPassword } = await import("../auth/password");
  const { defaultCompanySettings } = await import("./company");

  const [existingAdmin] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);

  if (!existingAdmin) {
    await db.insert(admins).values({
      name: "Admin User",
      email,
      passwordHash: hashPassword(password),
    });
    console.log(`Created admin ${email}`);
  } else {
    console.log(`Admin ${email} already exists`);
  }

  const [existingSettings] = await db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.id, "company"))
    .limit(1);

  if (!existingSettings) {
    await db.insert(settings).values({
      id: "company",
      companyName: defaultCompanySettings.companyName,
      tagline: defaultCompanySettings.tagline,
      email: defaultCompanySettings.email,
      phone: defaultCompanySettings.phone,
      website: defaultCompanySettings.website,
      address: defaultCompanySettings.address,
      social: {
        instagram: defaultCompanySettings.instagram,
        facebook: defaultCompanySettings.facebook,
        youtube: defaultCompanySettings.youtube,
      },
    });
    console.log("Created company settings");
  } else {
    console.log("Company settings already exist");
  }

  const { categories } = await import("./schema");
  const { categorySchemas } = await import("../categories/field-schemas");
  const { imageForCategory } = await import("../media");
  const { builtinFieldSchema } = await import("../categories/field-schemas");
  let createdCategories = 0;

  for (const schema of categorySchemas) {
    const [existingCategory] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, schema.slug))
      .limit(1);
    if (existingCategory) continue;
    await db.insert(categories).values({
      name: schema.name,
      slug: schema.slug,
      imageUrl: imageForCategory(schema.slug),
      description: schema.displayFormula ? `Display rate: ${schema.displayFormula}` : null,
      status: "active",
      fieldSchema: builtinFieldSchema(schema),
      variantSchema: schema.variantFields,
    });
    createdCategories += 1;
  }
  console.log(`Seeded ${createdCategories} categories`);
  const { ensureBuiltinSchemas } = await import("../categories/sync");
  await ensureBuiltinSchemas();
  console.log("Refreshed built-in category fields");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
