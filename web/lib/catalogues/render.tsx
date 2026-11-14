import { Font, renderToBuffer } from "@react-pdf/renderer";
import { CatalogueDocument } from "@/lib/catalogues/document";
import type { CataloguePdfModel } from "@/lib/catalogues/content";

let hyphenationReady = false;

export async function renderCataloguePdf(model: CataloguePdfModel) {
  if (!hyphenationReady) {
    Font.registerHyphenationCallback((word) => [word]);
    hyphenationReady = true;
  }
  return renderToBuffer(<CatalogueDocument model={model} />);
}
