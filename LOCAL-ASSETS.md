# Local assets (not on GitHub)

Requirement docs, screenshots, catalogue source PDFs/photos, and client image dumps live in `local-assets/` and are gitignored.

```
local-assets/
  requirements/          PDFs, release pack, screenshots, planning notes
  catalogues/data/       catalogue JSON + products-100 extract
  catalogues/public/     /catalogue/* and /marketing/* import photos
  product-images/        raw client WhatsApp photos
```

Import tooling reads from this folder (`web/lib/db/import-*.ts`, `scripts/extract_catalogue.py`, `scripts/build_products_100.py`).

Runtime product images stay on Cloudflare R2. Only small `web/public/images/` fallbacks ship with the app.
