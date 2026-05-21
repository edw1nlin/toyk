# Japan Trip 2026

Cloudflare Worker + Assets + D1 version of the Japan Trip dashboard.

## New itinerary features

- Google Maps link per plan card.
- Completed checkbox for every plan.
- Drag-and-drop reorder inside a day.
- Drag-and-drop move between days.
- Cloudflare D1 sync with browser localStorage fallback.

## Files

- `worker.js` — Cloudflare Worker API for expenses and travel plans.
- `schema.sql` — D1 tables for expenses and plans.
- `public/index.html` — app HTML.
- `public/styles.css` — app styles.
- `public/app.js` — app logic.
- `wrangler.toml` — Cloudflare deployment config.

## Setup

1. Put `postcard-fuji-pagoda.jpg` inside the `public/` folder. The ZIP already includes it if it was available when generated.
2. Create a D1 database in Cloudflare, for example `japan-trip-db`.
3. Copy the D1 database ID into `wrangler.toml`.
4. Run the schema:

```bash
npx wrangler d1 execute japan-trip-db --remote --file=schema.sql
```

5. Deploy:

```bash
npx wrangler deploy
```

## Existing database note

If your `plans` table already exists from an older version, the Worker will automatically add the `completed` and `order_index` columns the first time `/api/plans` is called.

## Local development

```bash
npm install
npm run db:migrate:local
npm run dev
```

Default passcode: `00000`. Change `PASSWORD` in `public/app.js` if needed.
