# Japan Trip 2026

Complete Cloudflare Workers + Assets + D1 travel dashboard.

## Features

- Editable day-by-day city route.
- Route updates plan and expense day labels.
- Daily travel plans with Google Maps links.
- Completed checkboxes for plans.
- Drag-and-drop plan reorder and move between days.
- Shared expense tracker and settlement calculation.
- Weather cards.
- JSON backup/export/import.

## Deploy

1. Replace `database_id` in `wrangler.toml` with your real Cloudflare D1 database ID.
2. Commit all files to GitHub.
3. Use this Cloudflare deploy command:

```bash
npx wrangler deploy --config wrangler.toml --assets ./public
```

4. Run the schema once:

```bash
npx wrangler d1 execute japan-trip-db --remote --file=schema.sql
```

Default passcode: `00000` in `public/app.js`.
