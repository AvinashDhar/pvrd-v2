import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import type { CataloguePdfModel, CataloguePdfProduct } from "@/lib/catalogues/content";

const navy = "#001F3D";
const navyMid = "#003C6C";
const lime = "#A3CB46";
const steel = "#54789C";
const mist = "#E8F0F6";
const ink = "#142033";

const styles = StyleSheet.create({
  cover: {
    backgroundColor: navy,
    color: "#ffffff",
    paddingTop: 42,
    paddingHorizontal: 46,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  kicker: {
    color: lime,
    fontSize: 10,
    letterSpacing: 2.2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 28,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  company: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: "#ffffff",
  },
  tagline: {
    marginTop: 6,
    fontSize: 12,
    color: "#d5e4c2",
  },
  catalogueLabel: {
    color: lime,
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  category: {
    fontFamily: "Helvetica-Bold",
    fontSize: 34,
    lineHeight: 1.15,
    color: "#ffffff",
  },
  meta: {
    marginTop: 14,
    fontSize: 11,
    color: "#d6e2ee",
  },
  contact: {
    fontSize: 10,
    color: "#d6e2ee",
    marginTop: 3,
  },
  body: {
    paddingTop: 48,
    paddingBottom: 42,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    color: ink,
  },
  running: {
    position: "absolute",
    top: 18,
    left: 36,
    right: 36,
    fontSize: 8,
    color: steel,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 8,
    color: steel,
  },
  rule: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: lime,
  },
  card: {
    borderBottomWidth: 1,
    borderBottomColor: "#e4ebf2",
    paddingBottom: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  photo: {
    width: 86,
    height: 86,
    objectFit: "contain",
    backgroundColor: mist,
    borderRadius: 4,
  },
  placeholder: {
    width: 86,
    height: 86,
    backgroundColor: mist,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: navyMid,
  },
  copy: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: navy,
  },
  brand: {
    marginTop: 2,
    fontSize: 9,
    color: steel,
  },
  facts: {
    flexDirection: "row",
    marginTop: 6,
  },
  fact: {
    width: "33%",
    paddingRight: 8,
  },
  factLabel: {
    fontSize: 7,
    color: steel,
    letterSpacing: 0.6,
    fontFamily: "Helvetica-Bold",
  },
  factValue: {
    marginTop: 1,
    fontSize: 9,
    color: ink,
  },
  description: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 1.35,
    color: "#334155",
  },
  feature: {
    marginTop: 2,
    fontSize: 8,
    color: "#334155",
  },
  variantTitle: {
    marginTop: 7,
    fontSize: 7,
    letterSpacing: 0.6,
    color: steel,
    fontFamily: "Helvetica-Bold",
  },
  variantHead: {
    flexDirection: "row",
    backgroundColor: mist,
    marginTop: 3,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  variantRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4ebf2",
  },
  cellName: { width: "34%", fontSize: 8 },
  cell: { width: "22%", fontSize: 8 },
  headText: { fontFamily: "Helvetica-Bold", color: navyMid, fontSize: 7 },
});

export function CatalogueDocument({ model }: { model: CataloguePdfModel }) {
  const generated = formatDate(model.generatedAt);
  const countLabel = `${model.products.length} ${model.products.length === 1 ? "product" : "products"}`;
  return (
    <Document title={`${model.categoryName} Catalogue`} author={model.companyName}>
      <Page size="A4" style={styles.cover}>
        <View style={styles.rule} />
        <View>
          <Text style={styles.kicker}>CATEGORY PDF</Text>
          {model.logo ? (
            // react-pdf Image is not an HTML image and has no alt prop.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={model.logo} style={styles.logo} />
          ) : null}
          <Text style={styles.company}>{model.companyName}</Text>
          {model.tagline ? <Text style={styles.tagline}>{model.tagline}</Text> : null}
        </View>
        <View>
          <Text style={styles.catalogueLabel}>CATALOGUE</Text>
          <Text style={styles.category}>{model.categoryName}</Text>
          <Text style={styles.meta}>Generated {generated}</Text>
          <Text style={styles.meta}>{countLabel}</Text>
        </View>
        <View>
          {model.address ? <Text style={styles.contact}>{model.address}</Text> : null}
          {model.phone || model.email ? (
            <Text style={styles.contact}>{[model.phone, model.email].filter(Boolean).join("  ·  ")}</Text>
          ) : null}
          {model.website ? <Text style={styles.contact}>{model.website}</Text> : null}
        </View>
      </Page>
      <Page size="A4" style={styles.body}>
        <View style={styles.rule} fixed />
        <Text style={styles.running} fixed>
          {model.companyName}  ·  {model.categoryName} Catalogue
        </Text>
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `${generated}  ·  ${pageNumber} / ${totalPages}`}
        />
        {model.products.map((product, index) => (
          <ProductCard key={`${product.sku}-${product.name}-${index}`} product={product} />
        ))}
      </Page>
    </Document>
  );
}

function ProductCard({ product }: { product: CataloguePdfProduct }) {
  const initial = (product.name.trim()[0] ?? "P").toUpperCase();
  return (
    <View style={styles.card} minPresenceAhead={110}>
      <View style={styles.row}>
        {product.image ? (
          // react-pdf Image is not an HTML image and has no alt prop.
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={product.image} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
        <View style={styles.copy}>
          <Text style={styles.name}>{product.name}</Text>
          {product.brand || product.sku ? (
            <Text style={styles.brand}>{[product.brand, product.sku].filter(Boolean).join("  ·  ")}</Text>
          ) : null}
          <View style={styles.facts}>
            <Fact label="SIZE" value={product.size || "-"} />
            <Fact label="FINISH" value={product.finishes || "-"} />
            <Fact label="PRICE" value={product.variants.length ? "See variants" : product.price} />
          </View>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
          {product.features.map((feature) => (
            <Text key={feature.label} style={styles.feature}>
              {feature.label}: {feature.value}
            </Text>
          ))}
        </View>
      </View>
      {product.variants.length > 0 ? (
        <View>
          <Text style={styles.variantTitle}>VARIANTS</Text>
          <View style={styles.variantHead}>
            <Text style={[styles.cellName, styles.headText]}>Name</Text>
            <Text style={[styles.cell, styles.headText]}>Finish</Text>
            <Text style={[styles.cell, styles.headText]}>Size</Text>
            <Text style={[styles.cell, styles.headText]}>Price</Text>
          </View>
          {product.variants.map((variant, index) => (
            <View key={`${variant.name}-${index}`} style={styles.variantRow}>
              <Text style={styles.cellName}>{variant.name}</Text>
              <Text style={styles.cell}>{variant.finish || "-"}</Text>
              <Text style={styles.cell}>{variant.size || "-"}</Text>
              <Text style={styles.cell}>{variant.price}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}
