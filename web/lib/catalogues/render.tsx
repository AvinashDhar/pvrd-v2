import { Font, renderToBuffer } from "@react-pdf/renderer";
import helvetica from "pdfkit/standard-fonts/Helvetica";
import helveticaBold from "pdfkit/standard-fonts/HelveticaBold";
import helveticaBoldOblique from "pdfkit/standard-fonts/HelveticaBoldOblique";
import helveticaOblique from "pdfkit/standard-fonts/HelveticaOblique";
import { CatalogueDocument } from "@/lib/catalogues/document";
import type { CataloguePdfModel } from "@/lib/catalogues/content";

let hyphenationReady = false;

export async function renderCataloguePdf(model: CataloguePdfModel) {
  if (!helvetica.name || !helveticaBold.name || !helveticaOblique.name || !helveticaBoldOblique.name) {
    throw new Error("PDF standard fonts failed to load.");
  }
  if (!hyphenationReady) {
    Font.registerHyphenationCallback((word) => [word]);
    hyphenationReady = true;
  }
  return renderToBuffer(<CatalogueDocument model={model} />);
}
