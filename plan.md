# OM PVRD Catalogue — End-to-End Implementation Plan

This document is the single source of truth for building the OM PVRD Admin Panel, public catalogue website, and future mobile APIs. It is derived from **Om Pvrd Admin Panel details** and the agreed low-cost, high-performance architecture.

---

## 1. Product summary

**OM PVRD** is a product catalogue platform for hardware / fittings (door handles, aldrops, hinges, kitchen accessories, etc.).

| Surface | Audience | Purpose |
|---------|----------|---------|
| **Admin Panel** | Administrators | Manage products, categories, brands, users, catalogues, banners, notifications, offers, loyalty, inquiries, settings, reports |
| **Public Web Catalogue** | Retailers, contractors, consumers | Browse products, view brands/categories, download catalogues, submit inquiries |
| **Mobile App APIs** (phase 2) | Same end users | Same data via `/api/v1` |

### Primary goals

- Cover **all** admin modules from the requirements document
- **Lightning-fast** reads (catalogue, lists, dashboards)
- **Minimal cost** for hosting, database, storage, and APIs
- Clean, professional, PVRD-branded UI
- Dynamic category schemas (admin can add fields without code deploys)

---

## 2. Confirmed tech stack

### 2.1 Frontend

| Item | Choice | Notes |
|------|--------|-------|
| Framework | **Next.js 15 (App Router)** | Admin + public site + API in one app |
| Language | **TypeScript** | End-to-end type safety |
| UI components | **shadcn/ui** + **Radix primitives** | Accessible, consistent admin patterns |
| Styling | **Tailwind CSS v4** | Utility-first, design tokens via CSS variables |
| Icons | **lucide-react** | Matches shadcn ecosystem |
| Forms | **React Hook Form** + **Zod** | Fast forms + schema validation |
| Tables | **TanStack Table** (via shadcn DataTable) | Search, sort, filter, bulk actions |
| Server/client data | **TanStack Query** + **Server Actions** | Cached lists, optimistic updates |
| Fonts | **Plus Jakarta Sans** (or **DM Sans**) | Modern, readable; not default Inter |
| PDF preview (admin) | Browser PDF embed / object URL | Generated files served from R2 |
| Charts (reports only) | Lightweight (e.g. **Recharts**) if needed | Dashboard itself prefers stat cards, not heavy charts |

### 2.2 Backend (inside Next.js)

| Item | Choice | Notes |
|------|--------|-------|
| Runtime | Next.js **Route Handlers** + **Server Actions** | No separate Nest/Express server in v1 |
| Validation | **Zod** | Shared between forms and APIs |
| Auth | **Better Auth** or **Clerk** | Admin + retailer / contractor / consumer roles |
| Jobs / async | **Inngest** (or Trigger.dev) | PDF generation, push sends, report rollups |
| Push notifications | **OneSignal** or **FCM** | Audience targeting by role |
| Email (optional) | Resend | Inquiry alerts, admin invites |

### 2.3 Database

| Item | Choice | Notes |
|------|--------|-------|
| Database | **MySQL 8** | Relational core. JSON columns hold category field schemas and product attributes |
| Hosting | **Hostinger MySQL** | Included with Business or Cloud hosting. Local development uses the MySQL container in `docker-compose.yml` |
| ORM | **Drizzle ORM** | Lives in the Next.js codebase (not deployed separately) |
| Migrations | **Drizzle Kit** | Versioned schema changes in `web/drizzle` |
| Cache (optional phase) | **Upstash Redis** | Dashboard counters, hot lists, rate limits |

**Drizzle is not a separate deployable.** The deployed pieces are the Next.js app, Hostinger MySQL, and Cloudflare R2.

### 2.4 File system / media

| Item | Choice | Notes |
|------|--------|-------|
| Object storage | **Cloudflare R2** | Images, logos, banners, catalogue PDFs |
| Image pipeline | Upload → WebP/AVIF variants (thumb / medium / original) | Fast lists + sharp catalogue pages |
| Access | Public CDN URLs or signed URLs | Product images public; private assets signed if needed |
| DB storage | **Public URL plus object key** | Never store image blobs in MySQL |

### 2.5 PDF catalogues

| Item | Choice | Notes |
|------|--------|-------|
| Generator | **@react-pdf/renderer** (preferred) | Cheaper/faster than full browser PDF |
| Trigger | Inngest job on generate / product change | Async; store result in R2 |
| Delivery | R2 public/signed URL | Preview + download |

### 2.6 Deployment

| Piece | Platform |
|-------|----------|
| Next.js app | **Hostinger** Business or Cloud Node.js hosting |
| Database | **Hostinger MySQL** |
| Files | **Cloudflare R2** |
| Background jobs | **Inngest** |
| Domains | Site domain on Hostinger. Image domain or `r2.dev` URL for media |

**Day-1 minimum:** Hostinger Node.js app + Hostinger MySQL + Cloudflare R2.

---

## 3. Design system (UI / CSS)

### 3.1 Brand direction (from requirements)

- Clean, professional, business-focused, minimal distractions
- **White** backgrounds
- **Blue** primary
- **Green** accent
- Light gray borders
- Dark text
- Clear hierarchy: large headings, readable tables and forms

### 3.2 CSS approach

- Tailwind + CSS variables for tokens:

```css
--color-primary: /* PVRD blue */
--color-accent:  /* PVRD green */
--color-border:  /* light gray */
--color-bg:      #ffffff
--color-text:    /* near-black */
--font-sans:     "Plus Jakarta Sans", ...
```

- Admin shell: permanent **left sidebar** + top header
- Content area occupies most of the screen
- Responsive: sidebar → drawer on tablet/mobile
- No card clutter on dashboards beyond metric tiles required by the doc
- Forms: tabbed / sectioned (not one endless scroll) — Basics, Specs, Images, Variants, Points, Additional

### 3.3 Admin chrome (every page)

**Top bar**

- Page title
- Welcome message
- Global search
- Notification icon
- Admin profile

**Left sidebar (permanent nav)**

1. Dashboard  
2. Products  
3. Categories  
4. Brands  
5. Users  
6. Reviews  
7. Catalogues  
8. Banners  
9. Notifications  
10. Special Offers  
11. Loyalty Points  
12. Inquiries  
13. Settings  
14. Reports  

### 3.4 Shared UI patterns

| Pattern | Usage |
|---------|--------|
| Stat cards | Dashboard + module analytics |
| Data tables | Products, users, brands, etc. — search, filters, sort, bulk actions |
| Row actions | View / Edit / Delete (and Block where relevant) |
| Image manager | Drag-drop, multi-upload, reorder, primary image, thumbnails |
| Confirm dialogs | Delete / hard actions |
| Empty states | First-time module guidance |
| Toasts | Success / error feedback |

---

## 4. Repository / codebase structure

Monorepo-friendly layout (single Next.js app is fine for v1; packages optional as it grows):

```text
PVRD-V2/
├── plan.md
├── apps/web/                          # Next.js application (or repo root if single app)
│   ├── app/
│   │   ├── (public)/                  # Public catalogue website
│   │   │   ├── page.tsx               # Home
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   ├── brands/
│   │   │   └── catalogues/
│   │   ├── (admin)/admin/             # Admin panel (auth-gated)
│   │   │   ├── layout.tsx             # Sidebar + header shell
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── users/
│   │   │   ├── reviews/
│   │   │   ├── catalogues/
│   │   │   ├── banners/
│   │   │   ├── notifications/
│   │   │   ├── offers/
│   │   │   ├── loyalty/
│   │   │   ├── inquiries/
│   │   │   ├── settings/
│   │   │   └── reports/
│   │   ├── api/v1/                    # Mobile / external REST API
│   │   ├── api/webhooks/              # Inngest, auth, etc.
│   │   ├── login/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                        # shadcn primitives
│   │   ├── admin/                     # Admin-specific (sidebar, data-table, image-uploader)
│   │   ├── catalogue/                 # Public catalogue UI
│   │   └── forms/                     # Product form, category schema builder
│   ├── lib/
│   │   ├── db/                        # Drizzle client + schema + queries
│   │   ├── auth/                      # Session, RBAC helpers
│   │   ├── storage/                   # R2 upload/signed URL helpers
│   │   ├── pdf/                       # Catalogue PDF templates
│   │   ├── validations/               # Zod schemas
│   │   └── utils/
│   ├── jobs/                          # Inngest functions
│   ├── public/
│   └── package.json
├── drizzle/                           # Migrations (if not under lib/db)
└── README.md
```

### Conventions

- **Server Components** by default; Client Components only for interactive widgets
- Feature folders colocated under `app/(admin)/admin/<module>`
- All DB access through `lib/db` (no raw queries scattered in UI)
- All env secrets via Hostinger environment variables or `.env.local` (`DATABASE_URL`, R2 keys, admin password)

---

## 5. Database model (MySQL + Drizzle)

### 5.1 Core principles

- Relational tables for entities and relations
- **JSON** columns for category field schemas and product dynamic attributes
- Soft delete / hide where the requirements specify (products, categories)
- Indexes on foreign keys, status, SKU, and common filters
- Case-insensitive `LIKE` on `utf8mb4_unicode_ci` for product and brand search

### 5.2 Main tables

| Table | Purpose |
|-------|---------|
| `admins` / auth tables | Admin accounts |
| `users` | Retailers, contractors/carpenters, consumers |
| `categories` | Name, image, status, `field_schema`, `variant_schema` |
| `brands` | Name, logo, description, status |
| `brand_categories` | Brand ↔ category links |
| `products` | Core pricing + `attributes` JSON + category/brand FKs |
| `product_variants` | Size/finish/price/points + variant attributes |
| `product_images` / `variant_images` | URL, sort_order, is_primary |
| `banners` | Homepage / category / promotional |
| `notifications` | Draft / scheduled / sent + audience |
| `offers` | Product/category/brand offers, gifts, schedules |
| `loyalty_rules` | Earn/redeem rules |
| `loyalty_wallets` | Per-user points balances |
| `loyalty_transactions` | Ledger history |
| `reviews` / `review_replies` | Consumer → contractor reviews |
| `inquiries` | Product / catalogue / general + follow-up status |
| `catalogues` | category_id, pdf_url, status, generated_at |
| `activity_logs` | Dashboard recent activity feed |
| `settings` | Company info, logo, contacts, social links |
| `analytics_events` | Views, downloads, banner clicks (append-only) |
| `report_snapshots` | Pre-aggregated report rows (optional) |

### 5.3 Dynamic categories (critical requirement)

Each category stores a **field schema** defining required/optional fields and variant config. Seed the **23 predefined categories** from the requirements (Curtain Brackets, Door Aldrop, Door Handles, Door Kits, … Miscellaneous). Admins can:

- Add / edit / delete / reorder fields  
- Mark required vs optional  
- Configure variant fields and variant images  
- Create **new categories** dynamically  

Common fields across products (always available): photo, name, SKU (optional), MRP, price, contractor discount, consumer discount, description, attributes/points as applicable.

Validation: product create/update validated against the category’s current schema (Zod built from JSON schema at runtime).

### 5.4 Category / product rules from requirements

- Hide category: hidden from app/web; no new products; existing products kept  
- Delete category: only if **zero** products; permanent  
- Soft delete / hide products supported; hard delete with confirmation  
- Schema changes: new fields empty on existing products; deleted fields hidden; don’t wipe unrelated data  

---

## 6. API design

### 6.1 Two access styles

1. **Server Actions** — Admin UI mutations (preferred for forms)  
2. **REST `/api/v1/*`** — Public web (where needed) + future mobile app  

### 6.2 Versioned REST outline

```text
/api/v1/auth/*
/api/v1/products
/api/v1/products/:id
/api/v1/categories
/api/v1/categories/:id
/api/v1/brands
/api/v1/catalogues/:categoryId
/api/v1/banners
/api/v1/inquiries
/api/v1/reviews
/api/v1/offers
/api/v1/loyalty/*
```

Admin-only endpoints either:

- Live under `/api/v1/admin/*` with admin role check, or  
- Prefer Server Actions under `app/(admin)` with the same RBAC helpers  

### 6.3 Cross-cutting API rules

- Zod validate every input  
- Cursor pagination on lists  
- RBAC: `admin` | `retailer` | `contractor` | `consumer`  
- Blocked users cannot login / inquire / redeem / download  
- Rate-limit public inquiry and auth endpoints  
- Activity log on meaningful admin writes  

---

## 7. Module requirements coverage

Every chapter from the admin panel document maps to a module below.

### 7.1 Dashboard

- Stat cards: products, categories, brands, users, contractors, retailers, pending approvals  
- Recent activities feed  
- Optional: quick actions, recent products, recent registrations  
- Prefer readability over complex charts  

### 7.2 Products

- Add / edit / delete (soft + hard)  
- Category + brand assignment  
- Images: multi-upload, primary, reorder, preview, variant images  
- Pricing: MRP, price, contractor discount, consumer discount  
- Loyalty points  
- Variants: size, finish, color/model, per-variant price & images; copy-price-from-parent checkbox where required  
- Search/filter: name, category, brand, SKU, active/inactive, price range  
- Analytics: totals, added this month, most viewed/downloaded, top categories, low visibility  

### 7.3 Categories

- CRUD + image (mandatory on create)  
- Dynamic field definitions + variant configuration  
- Active / inactive  
- Hide vs delete rules  
- Seed 23 category field sets; allow fully custom categories  

### 7.4 Brands

- Name, logo (JPG/PNG/WEBP), description, categories, status  
- Listing with product counts, search/filters, analytics  

### 7.5 Users

- Types: Retailer, Carpenter/Contractor, Consumer  
- Profile fields, block (with reason), delete/deactivate  
- Inquiry history, catalogue downloads, loyalty, activity  
- Search/filter + analytics  

### 7.6 Reviews

- Consumers review contractors only  
- Rating, title, description, optional images  
- Contractor replies; admin moderate approve/reject/delete  
- Listing, filters, analytics  

### 7.7 Catalogues

- Auto-generate category PDF (cover + products: image, brand, name, size, finishes, variants, features)  
- Generate / preview / download  
- Regenerate when products change (job queue)  
- Store PDF in R2  

### 7.8 Banners

- Types: Homepage, Category, Promotional  
- Scheduling, ordering, enable/disable, redirect links  
- Analytics: views/clicks  

### 7.9 Notifications

- Create/schedule/send by audience (all / retailers / carpenters / consumers)  
- Link to banners, products, categories, brands, offers, catalogues  
- Option: “Send notification along with banner”  
- Listing with status and recipient counts  

### 7.10 Special offers

- Active offers, product/category/brand offers  
- Free gift / seasonal offers  
- Scheduling + auto activate/deactivate  
- Offer analytics  

### 7.11 Loyalty points

- Earn rules (product/category, min purchase)  
- Redeem rules (conversion, max per order)  
- Wallets + transaction history  
- Points analytics  

### 7.12 Inquiries

- All inquiries, product inquiries, catalogue requests  
- Follow-up states: pending / contacted / closed  
- Search/filter + analytics  

### 7.13 Settings

- Company info, contacts, email, website, social links, logo  

### 7.14 Reports

- Most viewed / saved products  
- Top rated contractors  
- Catalogue downloads  
- Prefer snapshot/rollup jobs over heavy live aggregates  

---

## 8. Performance strategy

| Area | Approach |
|------|----------|
| Public catalogue | ISR / CDN revalidation on publish |
| Admin tables | Cursor pagination, indexed filters |
| Images | CDN + size variants; thumbs in tables |
| Dashboard | Cached counters (Redis or short-lived cache) |
| PDF | Async generation; cache in R2 until invalidation |
| DB | Hostinger MySQL; small connection pool; select only needed columns |
| Analytics writes | Append events; aggregate async |

---

## 9. Security

- HTTPS only  
- Auth on all `/admin` routes  
- Role checks on every mutation  
- Signed uploads to R2  
- File type/size validation (images)  
- Confirm destructive actions  
- Soft-delete preferences where business requires recoverability  
- Secrets never committed; use env vars  

---

## 10. Environments

| Env | App | Database | Storage |
|-----|-----|----------|---------|
| Local | `next dev` | Docker MySQL in `docker-compose.yml` | R2 `pvrd` bucket |
| Production | Hostinger Node.js | Hostinger MySQL | R2 `pvrd` bucket |

---

## 11. Implementation phases

### Phase 0 — Foundation

- Next.js + TypeScript + Tailwind + shadcn  
- Drizzle + MySQL schema skeleton  
- Auth + admin layout (sidebar/header)  
- Settings module (company logo needed later for PDFs)  

### Phase 1 — Catalogue core

- Categories (schema builder + seed 23 categories)  
- Brands  
- Products + variants + image upload (R2)  

### Phase 2 — Dashboard & users

- Dashboard stats + activity feed  
- User management (roles, block, analytics)  

### Phase 3 — Engagement

- Banners  
- Notifications (+ banner integration)  
- Special offers  
- Loyalty  

### Phase 4 — Trust & ops

- Reviews  
- Inquiries  
- Catalogues PDF pipeline  
- Reports  

### Phase 5 — Public web + mobile API

- Public catalogue pages (ISR)  
- Stabilize `/api/v1` for mobile  

---

## 12. Cost posture (target)

| Service | Role | Early target |
|---------|------|--------------|
| Hostinger | Next.js app and MySQL | Business or Cloud plan |
| Cloudflare R2 | Files | Free tier, no egress fees |
| Inngest | Jobs | Free tier |
| OneSignal / FCM | Push | Free tier |
| Upstash | Cache (later) | Free → low paid |

Avoid always-on fat VPS and storing media in the database.

---

## 13. Success criteria

- All 14 admin nav modules usable end-to-end per requirements  
- Dynamic categories work without code changes for new fields  
- Image reorder + primary image reliable  
- Category PDF generate/preview/download works asynchronously  
- Public catalogue pages feel instant (CDN/ISR)  
- Monthly infra cost stays low at early traffic  
- Mobile can consume `/api/v1` without rewriting the backend  

---

## 14. Out of scope for v1 (explicit)

- Separate Nest/Laravel backend  
- Storing images/PDFs in MySQL  
- Synchronous PDF generation on request thread  
- Real-time WebSocket admin (polling/refetch is enough)  
- Native mobile app UI (API-ready only until Phase 5+)  

---

## 15. Next action after this plan

1. Scaffold Next.js app with Tailwind, shadcn, folder structure above  
2. Connect Hostinger or local MySQL + Drizzle; create initial migrations  
3. Build auth + admin shell matching sidebar/header design  
4. Implement Categories → Brands → Products vertical slice  

---

*Document version: 1.1 — aligned with Om PVRD Admin Panel requirements and the Next.js + MySQL (Hostinger) + Drizzle + Cloudflare R2 stack.*
