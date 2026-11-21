# Its4u Store

E-commerce website with an admin panel for a mobile phone shop. New and used phones, graded by condition, and marked PTA Approved, Non-PTA or JV.

Built by HK DevLab with Next.js 15, TypeScript, Tailwind CSS, Prisma and SQLite.

## Run it

```bash
npm install
npx prisma generate
npm run setup        # creates the database and adds 10 sample phones
npm run dev          # http://localhost:3000
```

For a production build: `npm run build` then `npm start`. The fonts are stored in the project (`app/fonts`), so building needs no internet for fonts. If `npm run build` says it cannot replace a Prisma file (EPERM), stop `npm run dev` first, because it locks that file on Windows.

## Settings (.env)

Copy `.env.example` to `.env`.

| Key | What it does |
| --- | --- |
| `ADMIN_USERNAME` | Admin login username (not case sensitive). Defaults to `admin`. |
| `ADMIN_PASSWORD` | Admin login password. |
| `AUTH_SECRET` | Long random string that signs the admin session cookie. |
| `NEXT_PUBLIC_SITE_URL` | The public address, e.g. `https://its4u.pk`. Used for canonical links, the sitemap and social sharing. |
| `NEXT_PUBLIC_CREDIT_URL` | Optional. Link for "Website by HK DevLab" in the footer. Leave it empty to show plain text. |

**Before going live, change the username, password and `AUTH_SECRET`, and set `NEXT_PUBLIC_SITE_URL`.**

## Admin panel

Open `/admin` and sign in with the username and password from `.env`. After 5 wrong attempts the sign-in is locked for 15 minutes.

- **Dashboard:** pending orders, today's orders, delivered revenue, a 7-day orders chart, and phones that are sold out or on their last piece.
- **Products:** add, edit, hide and delete phones. Upload up to 8 photos each (drag and drop works), set condition, PTA status, battery health, price, old price, stock, warranty and a private IMEI.
- **Orders:** change status and message the customer on WhatsApp. Cancelling puts the stock back.
- **Settings:** shop name, WhatsApp number, phone, address and delivery charges.

## What customers can do

- browse and filter by type (new/used), brand, condition, PTA status, storage and price
- add to cart and check out with Cash on Delivery or by sending the order on WhatsApp
- track an order with the order number and their phone number
- read how phones are graded and the terms, warranty and returns page (`/policies`)

## Design

- **Fonts:** Space Grotesk (headings) and DM Sans (text), stored in `app/fonts` (Latin subset, free under the SIL Open Font License) and loaded with `next/font/local`. They are served from your own domain, with `font-display: swap` and a size-matched fallback, so there is no request to Google, no layout jump, and building never depends on Google Fonts. On Linux servers the build also adds `preload` links for them.
- **Colours and sizes:** all in one place, `lib/design-tokens.ts` and `tailwind.config.ts`. A test checks that every text and background pair meets WCAG AA contrast.
- **Headings:** every page has exactly one `h1`, with `h2` and `h3` below it. Heading sizes are fluid, so they shrink on phones.

- **Footer:** a dark glass card with three soft lights that slowly "breathe" (indigo, amber, cyan), a glowing WhatsApp button, link columns (Shop, Help, Contact with tap-to-call), a divider and a credit line. The lights pause while the footer is off screen, and everything stays still for people who prefer reduced motion. Content fades up on scroll in browsers that support it, and is simply shown in the others. Text over the brightest light is tested for contrast.

## SEO

- Title, description, canonical link and Open Graph tags on every page (filtered shop pages get their own title)
- Structured data (schema.org): `Store` and `WebSite` on the home page, `Product` with price in PKR and stock on every phone, and breadcrumbs
- `/sitemap.xml` (all visible phones) and `/robots.txt` (hides admin, cart, checkout, order and tracking pages)
- Private pages and search result pages are `noindex`
- Real `404` page, images with alt text and fixed sizes, security headers

## Tests

```bash
npm test                                   # unit tests: logic, database, colours, SEO, components
npm run typecheck                          # TypeScript
npm run build && npm start                 # then, in another terminal:
node scripts/smoke.mjs                     # HTTP checks against the running server
```

`BASE_URL=http://localhost:3100 node scripts/smoke.mjs` points the smoke test at another port.
The smoke test expects the 10 sample phones from `npm run seed`.

## Demo data

```bash
npx tsx scripts/demo-orders.ts   # adds 7 sample orders so the dashboard has something to show
npx tsx scripts/reset-demo.ts    # removes all orders, products and uploaded images (then run: npm run seed)
```

For a real customer: run `reset-demo.ts`, then add the shop's real phones in the admin panel and fill in the Settings page.

## Hosting notes

The database is a SQLite file (`prisma/dev.db`) and uploaded photos are saved in `data/uploads`. Both need a **server with a persistent disk** (a VPS or similar). They will not survive on serverless hosting such as Vercel. To host there, switch Prisma to PostgreSQL and store images in a service like Cloudinary.

Set `UPLOAD_DIR` to keep uploads somewhere else. Set `NEXT_DIST_DIR` to build into another folder, for example when testing a build while another server is running.

## Still to do before launch

- fill in the Settings page (shop WhatsApp number, address, delivery charges)
- confirm the warranty and return periods with the shop, and update `/policies` to match
- confirm with the shop what "JV" means for their stock
- add real photos of the phones (until then a drawing of a phone is shown)
- add online payments (JazzCash, Easypaisa, card) if wanted
