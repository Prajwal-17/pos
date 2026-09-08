# Relay Mobile

A compact Expo companion for the shop. Desktop records are read-only; daily money entries are editable.

## Screens

- **Home:** today's sales and estimates, recent bills, Money entry and Reports.
- **Sales / Estimates:** search, dates, sorting, historical line items, customer and product links, PDF sharing.
- **Customers:** balances, search and filters, ledger with running balances, sales, estimates and account details.
- **Products:** prices, status, price history and linked bills. Product images are omitted.
- **Reports:** separate sales and estimate totals, trends, top products by sales quantity, current dues and advances.
- **Money:** cash, UPI providers, vendor payments, calendar history, edit and delete. Vendor names suggest the six most recently saved matches.

Native Android/iOS are the product targets. Web previews use the same screens and SQLite queries.

## Setup and snapshot

Run from the repository root with dependencies installed and Python 3 available:

```bash
pnpm --dir apps/mobile snapshot:desktop /path/to/desktop.db
pnpm --dir apps/mobile start
# Or preview in a browser:
pnpm --dir apps/mobile web
```

The snapshot command uses SQLite backup to include WAL data, validates the desktop schema and
atomically replaces `assets/data/desktop.db`. Run it before the first start and again when desktop
data needs refreshing. Restart Expo and reload the app after refreshing. The private asset is
ignored by Git but included in local app bundles; do not publish a build containing shop data.
The source database is never modified.

On native startup, Expo SQLite imports the asset into `relay-desktop.db`, checks its integrity and
schema, then enforces `PRAGMA query_only`. Web loads the same asset into an in-memory SQLite database
through Expo's `deserializeDatabaseAsync`, avoiding repeated browser-file rewrites. Neither runs desktop migrations or writes desktop
records. Schema, IDs, historical product snapshots, integer paisa and integer milli-unit quantities
are preserved. Portable shared types and quantity helpers come from `apps/desktop/src/shared`.

Money entries use a separate connection and the existing `quickcart-ledger.db` filename, so updating
the desktop snapshot preserves them. They remain accessible if snapshot initialization fails.
Only this money database runs the mobile migrations. There is no cloud sync or in-app import.
Clearing application data removes locally saved money entries.

Dates and report boundaries use Asia/Kolkata. Sales and estimates stay separate in totals; product
rankings include sales only. Customer dues and advances use current balances, including archived
accounts, independently of the selected report period. A bill appears in a customer ledger only
when the source database contains a corresponding ledger entry.

## Structure

```text
src/
  app/                    Thin Expo Router routes and navigation layouts
  features/
    home/                 Overview
    money/                Writable ledger, providers and vendor inputs
    customers/            Customer workspace and ledger
    transactions/         Sales, estimates, bill details and PDF export
    products/             Catalog and product history
    reports/              Trends and balance drilldowns
  components/ui/          Shared mobile controls and list primitives
  lib/db/                 Connection providers, schema contract and read-query helpers
  lib/format/             Money, quantities and IST dates
scripts/                  Snapshot refresh and mobile verification
```

Feature repositories contain parameterized SQLite queries. TanStack Query owns read-only snapshot
state and pagination (50 rows per page); screen-local state owns search and filters. Routes do not
contain queries. NativeWind semantic tokens live in `tailwind.config.js` and extend the Relay palette
in `../../DESIGN.md`. Lucide supplies UI icons; bundled payment marks are attributed in `assets/README.md`.

## Mobile UI contract

- Warm canvas, white surfaces, charcoal actions and terracotta selection. Teal identifies sales;
  berry identifies estimates. System fonts and tabular money amounts.
- Bottom tabs: Home, Sales, Estimates, Customers, Products. Details open above tabs with Back.
- Compact page headers, full monetary values, useful empty/error states and touch targets of at least 44px.
- Native screen transitions, press feedback and subtle haptics. No app-name banner or explanatory filler.
- Money entry keeps Save within reach, confirms unsaved changes and destructive actions, and preserves
  receipts for archived providers. Browser and phone storage are independent.
- PDF export uses stored historical items and the copied store profile. Native uses Expo Print and
  the share sheet; web opens the browser print dialog. Print styles are isolated from app chrome.

## Web runtime

`web.output: single` avoids SQLite worker failures during static rendering. Metro bundles `.wasm`
and `.db` assets and serves COOP `same-origin` / COEP `credentialless` headers for SQLite's
SharedArrayBuffer. A separately served web export needs equivalent headers.

For a server-only preview without launching standalone React Native DevTools:

```bash
EXPO_UNSTABLE_HEADLESS=1 pnpm --dir apps/mobile web --port 8084
```

This does not change Chromium sandbox permissions.

## Verification

```bash
pnpm --dir apps/mobile lint
pnpm --dir apps/mobile typecheck
python3 apps/mobile/scripts/check-snapshot.py
node apps/mobile/scripts/check-read-model.cjs
# With Expo web running on port 8084:
node apps/mobile/scripts/check-web.cjs
node apps/mobile/scripts/check-workspace-web.cjs
node apps/mobile/scripts/check-browse-web.cjs
node apps/mobile/scripts/check-bill-export.cjs
```

The read-model checks require Node 22.13+ with `node:sqlite`. Browser checks reuse the installed
Playwright driver from the desktop workspace and target **only Expo mobile**, each with isolated
browser storage. Set `MOBILE_WEB_URL` to change the preview URL. Snapshot checks apply desktop
migrations only to disposable test databases. These commands do not launch desktop E2E tests.

Checks cover snapshot safety, schema parity, read-only enforcement, pagination, paisa/quantity
accuracy, ledger ordering, IST dates, report totals, mobile navigation, PDF pagination and money
entry persistence. Screenshots and the synthetic PDF go to `/tmp/relay-mobile-check` and
`/tmp/relay-mobile-workspace`. Verify native keyboard, large text, safe areas, haptics and PDF sharing
in Expo Go on the target phone; browser checks cannot validate native behavior.
