# Relay Mobile

Relay Mobile is a portrait daily ledger for recording one financial close per
business date. It is an independent Expo application and does not connect to the desktop billing app.

## Capabilities

- Today-first daily entries with calendar history
- Cash received and online receipts split by provider
- Repeatable supplier and distributor payments
- Daily received, paid-out, and net totals
- Editable and deletable historical entries
- Reusable custom online channels

## Data and money

Data is stored only on the device in `quickcart-ledger.db` through Expo SQLite. The application
enables WAL mode and foreign keys, then applies versioned migrations at startup. Clearing app data
or uninstalling the application can remove the ledger; backup and cloud sync are not included.

All money is stored as integer paisa. Business dates are stored as `YYYY-MM-DD` values in the
Asia/Kolkata calendar. A day's figures are calculated as:

```text
received = cash + online receipts
paid     = supplier payments
net      = received - paid
```

## Stack

- Expo SDK 57, React Native, and Expo Router
- Expo SQLite for local persistence
- NativeWind 4 with Tailwind CSS 3
- CVA, `clsx`, and `tailwind-merge` for reusable variants
- Lucide React Native icons

Relay uses the existing charcoal Continuum mark in `../../assets/mobile`. Launcher and splash PNGs
are rasterizations of its Android foreground SVG. The app name is Relay; the existing database
filename and app scheme remain stable so this UI update does not strand local records.

Theme values are defined in `tailwind.config.js`. Application routes live under `src/app`, feature screens and domain code under `src/features`, shared primitives under `src/components/ui`,
and database initialization / portable formatting under `src/lib`. Route files only compose screens.

## Web preview

Web uses client-only (`web.output: single`) rendering because the ledger reads device-local data.
This also avoids the SDK 57 static-rendering worker-chunk failure during development.
Expo SQLite uses WebAssembly on web. The Metro development server is configured in
`metro.config.js` to bundle `.wasm` assets and send the cross-origin isolation headers required by
`SharedArrayBuffer`. A separately deployed web build must provide equivalent COEP and COOP headers.

## Commands

Run from the repository root:

```bash
pnpm --dir apps/mobile start
pnpm --dir apps/mobile android
pnpm --dir apps/mobile ios
pnpm --dir apps/mobile web
pnpm --dir apps/mobile lint
pnpm --dir apps/mobile typecheck
```

## Mobile UI contract

- Warm canvas `#F5F5F2`, white surfaces, charcoal `#283129` actions, terracotta `#B6532B` focus.
- Teal `#E3F5EF` icon plates use dark `#0B5C43` foregrounds; amounts stay ink coloured.
- System sans-serif, 16px form labels, 18px amount inputs, tabular totals, 48px main actions.
- Bottom navigation uses Expo Router tabs: Ledger, Sales, Estimates, and Customers, with Lucide
  icons. The latter three show a minimal placeholder until implemented. Entry and provider screens open
  above the tabs. Home has a compact page toolbar without an app-name header.
- Home opens on the selected day's record. History opens the calendar; future dates are disabled.
- Amounts use single-row inputs. Vendor names suggest the six most recently used saved names,
  filtered as you type and deduplicated without case; new names can be entered directly.
- Cash, UPI/online, and vendor payments are distinct, labelled groups. Provider marks are bundled.
- Save stays at the bottom, fields stop accepting edits during save, and leaving a dirty record
  requires confirmation. Successful saves return to the saved record with native haptic feedback.
- Check at 360×800 and 390×844, including large text, long names, large rupee amounts, keyboard,
  empty/error states, provider management, save, discard, and delete confirmation on a device.
- Native Android/iOS are the product targets. Web testing uses the same SQLite schema with
  `withTransactionAsync`; native uses exclusive transactions. Web confirmation dialogs use the
  browser’s confirmation prompt. Browser storage and device storage are independent.

## Browser regression check

With Expo web running, run from the repository root:

```bash
MOBILE_WEB_URL=http://localhost:8084 node apps/mobile/scripts/check-web.cjs
```

The check reuses the desktop workspace’s existing Playwright dependency and Chromium install.
It creates an isolated browser database and checks save/reload, totals, history, discard,
vendor suggestions, bottom navigation, provider management, historical receipts, and delete. Screenshots go to `/tmp/relay-mobile-check`.
