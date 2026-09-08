# Relay

Workspace packages use the `@relay` scope: `@relay/workspace`, `@relay/desktop`,
`@relay/eslint-config` and `@relay/typescript-config`. Native app identities remain Relay / Relay-Dev.

Relay contains an offline-first desktop billing application and a focused mobile daily ledger.

## Capabilities

### Desktop

- Fast keyboard-and-mouse billing for sales and estimates
- Product catalog with search, pricing history, images, and soft delete
- Customer accounts, payments, adjustments, and transaction ledgers
- Printable receipts and A4 PDF invoices
- Local dashboards, store settings, onboarding, and data export

### Mobile · Relay

- Today-first daily cash and online receipt entry, with calendar history
- Supplier and distributor payment tracking
- Daily received, paid-out, and net totals
- Private on-device SQLite storage

## Repository

```text
apps/
  desktop/                Electron billing application and local API
  mobile/                 Expo daily-ledger application
assets/
  desktop/                Shared Relay desktop identity assets
  mobile/                 Shared Relay mobile identity assets
packages/
  eslint-config/          Shared lint configuration
  typescript-config/      Shared TypeScript configuration
DESIGN.md                 Desktop UI and design-system contract
AGENTS.md                 Engineering rules for coding agents
```

The desktop application contains four source areas:

```text
apps/desktop/src/
  main/       Electron main process, Hono server, SQLite, and native handlers
  preload/    Safe renderer-to-Electron bridge
  renderer/   React application
  shared/     Types, schemas, constants, and cross-process utilities
```

The mobile application uses Expo Router screens under `apps/mobile/src/app`, reusable components
under `apps/mobile/src/components`, and its independent local data layer under
`apps/mobile/src/lib`.

## Requirements

- Node.js 22
- pnpm via Corepack; use the version declared in the root `package.json`
- Windows or Linux for packaged desktop builds
- Expo-supported Android or iOS tooling for the mobile application

## Quick start

```bash
corepack enable
pnpm install
pnpm dev
```

Start the mobile application separately with:

```bash
pnpm --dir apps/mobile start
```

## Common commands

Run these from the repository root:

| Command                               | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| `pnpm dev`                            | Start workspace development tasks        |
| `pnpm build`                          | Build all workspace packages             |
| `pnpm lint`                           | Lint all workspace packages              |
| `pnpm format`                         | Format the workspace                     |
| `pnpm --dir apps/desktop typecheck`   | Typecheck desktop application and tests  |
| `pnpm --dir apps/desktop test --run`  | Run the desktop test suite once          |
| `pnpm --dir apps/desktop build:win`   | Build the Windows installer              |
| `pnpm --dir apps/desktop build:linux` | Build Linux AppImage and Debian packages |
| `pnpm --dir apps/mobile start`        | Start the Expo development server        |
| `pnpm --dir apps/mobile typecheck`    | Typecheck the mobile application         |

Packaged desktop artifacts are written to `apps/desktop/dist/`.

## Runtime at a glance

Electron initializes and migrates a local SQLite database, then forks a Hono API server. The
React renderer talks to that server over local HTTP. The preload bridge is reserved for native
operations such as printing, file selection, product images, and PDF export.

The mobile application initializes its own on-device SQLite database and remains independent from
the desktop data model and runtime.

Development and production desktop builds use separate application data directories and ports so
an installed copy cannot conflict with local development.

The desktop app uses Relay application IDs, package names, data-directory names, local storage keys, API
token headers, and `relay.db` consistently across development, packaged, and standalone runs.
Changing from the former identity intentionally starts a new data location.

## Project documentation

- [Desktop development and operations](apps/desktop/README.md)
- [Mobile development and data model](apps/mobile/README.md)
- [Desktop UI and design-system contract](DESIGN.md)
- [Agent engineering instructions](AGENTS.md)
