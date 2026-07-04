I have everything needed. Here is the complete inventory.

---

# Renderer Frontend Inventory — `apps/desktop/src/renderer/src/`

## 1. `components/` — All Files

### Non-UI files (custom app components)

| File                                    | Purpose                                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/Sidebar.tsx`                | App navigation sidebar — draggable/resizable, docked or overlay (billing) variant, renders logo, "New Sale/Estimate" shortcuts, `navLinks`, and a static store profile card. |
| `components/highlighted-text.tsx`       | Tiny util component that highlights a search query substring inside text via `<mark>`.                                                                                       |
| `components/layouts/RootLayout.tsx`     | Top-level layout gate: shows a loading spinner during bootstrap, lazy-loads `OnboardingFlow` if not onboarded, otherwise renders `AppShell`.                                 |
| `components/layouts/AppShell.tsx`       | The actual app shell — animated sidebar (hidden on billing pages), header with collapsible toggle + dynamic page title + search input, and `<Outlet />`.                     |
| `components/layouts/SidebarLayout.tsx`  | Thin wrapper that just renders `<AppShell />`. (Appears unused by `routes.tsx`.)                                                                                             |
| `components/layouts/FullPageLayout.tsx` | Bare full-screen wrapper with just an `<Outlet />` (centered/max-w). (Appears unused by `routes.tsx`.)                                                                       |

### `components/ui/` — Shadcn-generated primitives

**Count: 22 files** — all Shadcn/ui new-york style generated primitives, not hand-written app logic.

`alert-dialog.tsx`, `badge.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `chart.tsx`, `checkbox.tsx`, `command.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `menubar.tsx`, `popover.tsx`, `select.tsx`, `separator.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `tooltip.tsx`.

---

## 2. `pages/` — Recursive

```
pages/
├── NotFoundPage.tsx                  # 404 catch-all route
├── billing/
│   └── BillingPage.tsx               # Top-level billing route (sale/estimate create + edit)
├── customers/
│   └── CustomersPage.tsx             # Customers directory route
├── dashboard/
│   ├── DashboardPage.tsx             # Route wrapper: reads :type param, validates, renders <Dashboard>
│   └── Dashboard.tsx                 # Inner component — transaction list + revenue header + ViewModal
├── export/
│   └── pdf/
│       └── PdfInvoicePage.tsx        # Standalone PDF invoice renderer (separate route, no shell)
├── home/
│   └── HomePage.tsx                  # Index route ("/") landing/home page
├── products/
│   └── ProductsPage.tsx             # Product catalog route
├── reports/
│   └── ReportsPage.tsx              # Reports route
└── settings/
    └── SettingsPage.tsx             # Settings route (parent with nested Outlet for sub-sections)
```

**Notes:**

- Only `pages/export/` has a subdirectory (`pdf/`).
- `dashboard/` is the only page dir with two files: `DashboardPage` (route param validation) vs `Dashboard` (actual UI). `routes.tsx` imports `DashboardPage`.
- All pages are flat single-file routes otherwise — sub-components live in `features/`.

---

## 3. `features/` — Recursive

**Two features have their OWN component subdirectories:**

- `billing/tabs/` (2 files)
- `onboarding/steps/` (4 files)

```
features/
├── billing/
│   ├── BillingHeader.tsx              # Billing screen top header
│   ├── LineItemsTable.tsx             # Line items table container
│   ├── LineItemRow.tsx                # Single line item row
│   ├── CustomerInputBox.tsx           # Customer picker input
│   ├── ProductDailogWrapper.tsx       # Wraps product picker dialog
│   ├── QuantityPresets.tsx            # Quick quantity preset buttons
│   ├── SummaryFooter.tsx              # Totals / summary footer
│   ├── BillingSaveStatus.tsx          # Sync/save status indicator
│   ├── BillPreview.tsx                # Live bill preview pane
│   ├── BillingSkeleton.tsx            # Loading skeleton
│   └── tabs/
│       ├── BillingTabBar.tsx          # Sale/estimate tab switcher bar
│       └── BillingTab.tsx             # Individual tab trigger
│
├── customers/
│   ├── CustomerLayout.tsx             # Layout shell for customer view
│   ├── CustomerSidebar.tsx            # Customer details sidebar
│   ├── CustomerTable.tsx              # Customers table container
│   ├── CustomerTableRow.tsx           # Single customer row
│   ├── CustomerDetails.tsx            # Customer detail panel
│   ├── CustomerSummaryCard.tsx        # Customer summary metric card
│   ├── CustomerTypeColor.tsx          # Color-codes customer role/type
│   └── CustomerDialog.tsx             # Create/edit customer dialog
│
├── dashboard/
│   ├── MetricsComponent.tsx           # Metrics section wrapper
│   ├── MetricCard.tsx                 # Single metric card
│   ├── StatCard.tsx                   # Stat display card
│   ├── ItemRow.tsx                    # Generic item row
│   ├── TopProductsChart.tsx           # Top products chart (recharts)
│   ├── SalesEstimatesChart.tsx        # Sales vs estimates chart
│   ├── RecentTransactionsTable.tsx    # Recent transactions table
│   ├── RecentTransactionsTableRow.tsx # Recent transaction row
│   └── ViewModal.tsx                  # Transaction detail modal
│
├── onboarding/
│   ├── OnboardingFlow.tsx             # Root onboarding orchestrator
│   ├── OnboardingStepper.tsx          # Step progress indicator
│   ├── OnboardingComplete.tsx         # Completion screen
│   └── steps/
│       ├── WelcomeStep.tsx            # Welcome intro step
│       ├── StoreIdentityStep.tsx      # Store name/identity step
│       ├── LocationStep.tsx           # Store location step
│       └── OwnerContactStep.tsx       # Owner contact info step
│
├── productDialog/
│   ├── ProductDialog.tsx              # Root product create/edit dialog
│   ├── ProductEditForm.tsx            # Product form fields
│   ├── ProductViewMode.tsx            # Read-only product view
│   ├── ProductImageCropSelector.tsx   # Image crop UI component
│   ├── ProductHistoryTimeline.tsx     # Price-change history timeline
│   ├── ProductTransactionsTable.tsx   # Product's transactions table
│   ├── StatusIndicator.tsx            # Sync/status badge
│   └── productImageCrop.ts            # Pure image-crop helper logic (non-component)
│
├── products/
│   ├── ProductHeader.tsx              # Products list header
│   ├── ProductListItem.tsx            # Single product list item
│   └── ProductResults.tsx             # Products results container
│
├── search/
│   ├── SearchDropdown.tsx             # Global search dropdown
│   └── MemoizedSearchDropDown.tsx     # Memoized wrapper of SearchDropdown
│
├── settings/
│   ├── SettingsSections.tsx           # Defines section pages (BillingSettingsPage, ExportsSettingsPage, StoreProfileSettingsPage) — used by routes
│   ├── SettingsField.tsx              # Reusable settings field row
│   └── settingsNavigation.ts          # Settings nav config (non-component)
│
└── transactionDashboard/
    ├── DashboardTable.tsx             # Transactions table for dashboard
    ├── DashboardTableRow.tsx          # Single transaction row
    ├── DashboardCard.tsx              # Transaction summary card
    └── DateRangePicker.tsx            # Date range filter picker
```

---

## 4. Layout Scaffolding — What Renders

### `components/layouts/RootLayout.tsx` (the gate)

Uses `useAppBootstrap()` (bootstrap state) and `useAppStore` (`isOnboardingComplete`). Renders one of three states inside `<AnimatePresence mode="wait">`:

1. **Bootstrapping** → full-screen spinner ("Loading...").
2. **Not onboarded** → `<Suspense>` around lazy-imported `<OnboardingFlow />`.
3. **Ready** → `<AppShell />` + `<ReactQueryDevtools />`.

So `RootLayout` is the onboarding/bootstrap gate, NOT the visual shell.

### `components/layouts/AppShell.tsx` (the actual shell)

This is the real chrome. It renders:

- A `flex h-screen w-full` container.
- **Sidebar slot:** Hidden entirely on billing pages. On non-billing pages, renders `<Sidebar />` inside an animated (motion) collapsible `<motion.div>`, toggled by a `PanelLeftClose`/`PanelLeftOpen` button in the header. On billing pages, instead renders `<Sidebar variant="overlay" />` (hover-to-reveal overlay).
- **Header** (`h-14`, hidden on billing): sidebar-toggle button + dynamic **page title** (derived from `pathname` via `getPageTitle()` — e.g. "Dashboard", "Products", "Sales Overview", "Settings", default "Workspace") + a **search `<Input />`** with a search icon (max-w-md). Note: the search input appears to be presentational only — no handler wired here.
- **`<main>`** with `<section className="flex-1 overflow-y-auto">` containing the **`<Outlet />`** (where page routes render).

### Sidebar.tsx (rendered inside AppShell)

- Resizable (`MIN 220 / MAX 400 / DEFAULT 288` px), width persisted to `localStorage`.
- Docked vs overlay (`variant` prop) — overlay mode uses `useSidebarStore` (open/pinned) + hover-open strip + click-outside-to-close.
- Content: QuickCart logo header, "New Sale" + "New Estimate" buttons, `navLinks`-driven nav (`@/constants/Navlinks`), and a hardcoded store-profile card at the bottom.

### Other layouts (exist but unused by current routes)

- `SidebarLayout.tsx` — just re-exports `<AppShell />`.
- `FullPageLayout.tsx` — bare `<Outlet />` full-screen wrapper.
- `routes.tsx` only references `RootLayout`; the routing tree uses `AppShell` indirectly via `RootLayout → AppShell → <Outlet/>`. No `SidebarLayout`/`FullPageLayout` imports.

---

## 5. Top-Level Providers — `App.tsx` + `main.tsx`

### `main.tsx` (entry point)

Minimal. Imports `./index.css`, then `createRoot(...).render(<StrictMode><App /></StrictMode>)`. No providers here.

### `App.tsx` (provider root)

Wraps everything in:

1. A `<div className="bg-background-secondary">` wrapper.
2. **`<QueryClientProvider client={queryClient}>`** — single `new QueryClient()` (default config, no custom options). This is the **TanStack Query** provider.
3. **`<RouterProvider router={router} />`** — React Router v7 `createHashRouter` (hash router, per Electron `file://` requirement) imported from `./routes`.
4. **`<Toaster />`** from `react-hot-toast` (position `bottom-center`), inside the QueryClientProvider.

### Notable observations on provider stack

- **No explicit Zustand `<Provider>`** at the root — Zustand stores are consumed via hooks (`useAppStore`, `useSidebarStore`, `useViewModalStore`) directly, which is the standard Zustand pattern (no context provider needed).
- **No ThemeProvider / no TooltipProvider** at the root (Shadcn providers, if needed, are likely per-component or absent).
- **The onboarding gate is NOT in `App.tsx`** — it lives inside `RootLayout` (the topmost route element), driven by `useAppStore.isOnboardingComplete`. So the router always mounts `RootLayout` first, which conditionally swaps between `OnboardingFlow` / `AppShell`.
- `ReactQueryDevtools` is mounted **inside `AppShell`** (i.e. only when the user is past onboarding), not at the `App.tsx` root.

### Router shape (`routes.tsx`)

Hash router with this tree:

- `/` → `RootLayout` (the bootstrap/onboarding gate + `AppShell`)
  - index → `HomePage`
  - `products` → `ProductsPage`
  - `customers` → `CustomersPage`
  - `dashboard/:type` → `DashboardPage` (`sales` / `estimates`)
  - `reports` → `ReportsPage`
  - `settings` → `SettingsPage` with nested children: index redirects to `store-profile`; plus `billing`, `exports` (these sub-pages are the named exports from `features/settings/SettingsSections.tsx`).
  - `billing/*` → `:type/create` and `:type/:id/edit` → `BillingPage` (note: the create/edit routes are duplicated in the source — likely a latent bug worth flagging during migration).
- `export/pdf/:type` → `PdfInvoicePage` (standalone, **outside** the shell — no `RootLayout`).
- `*` → `NotFoundPage`.

---

## Migration Roadmap Cheatsheet

- **Foundational / shell layer:** `main.tsx` → `App.tsx` (QueryClient + Router + Toaster) → `RootLayout` (bootstrap + onboarding gate) → `AppShell` (sidebar + header + search + Outlet) + `Sidebar.tsx`. Migrate these first since every page depends on them.
- **Independent leaf routes (good early candidates):** `HomePage`, `ProductsPage` (+ `features/products/*`), `ReportsPage`, `CustomersPage` (+ `features/customers/*`).
- **Medium complexity:** `SettingsPage` + `features/settings/*` (nested routes), `DashboardPage` + `features/dashboard/*` + `features/transactionDashboard/*`.
- **Highest complexity (do last):** `billing/*` + `features/billing/*` (debounced sync, tabs, save-status, dynamic sidebar overlay) and `features/productDialog/*` (image crop, history, transactions) + `features/onboarding/*` (multi-step lazy-loaded gate).
- **Reusable primitives:** 22 Shadcn `components/ui/*` + 2 generic utils (`Sidebar`, `highlighted-text`) — keep stable across phases.
  </task_result>
  </task>

````

**Tool: task**

**Input:**
```json
{
  "description": "Find migration hotspots & hardcoded colors",
  "subagent_type": "explore",
  "prompt": "Thoroughness: very thorough.\n\nI am planning a color-palette + minor-UI (padding/spacing/opacity) migration for a React + Tailwind v4 app. The migration is primarily a CSS variable swap in `apps/desktop/src/renderer/src/index.css`, but some components have hardcoded Tailwind classes that need manual tuning (e.g. opacity values like `bg-muted/30`, `bg-background/95`, raw hex colors, or inline style objects).\n\nSearch the entire `apps/desktop/src/renderer/src/` tree (EXCLUDING `components/ui/` which is Shadcn-generated and EXCLUDING `pages/export/pdf/` and anything obviously print/demo related like `DemoReceipts`).\n\nI need you to find and report:\n\n1. **Hardcoded color values** — any raw hex codes (`#...`), `rgb()`, `rgba()`, `oklch()`, or `hsl()` literals inside `.tsx` files (inline styles, motion animate props, constants). List file path + line + the value.\n\n2. **Opacity-tinted surface classes** that may need tuning after the palette swap — patterns like `bg-background/NN`, `bg-muted/NN`, `bg-card/NN`, `bg-surface-N/NN`, `bg-sidebar/NN`. List file path + line + the class.\n\n3. **Inline `style={{ ... }}` objects** in components that set colors, backgrounds, or gradients. List file + line.\n\n4. **Files using the old domain-specific tokens** — search for usages of: `--onboarding-*`, `--product-*`, `--search-*`, `--invoice-*`, `bg-product-`, `bg-search-`, `bg-onboarding-`, `text-product-`, `text-search-`, `border-product-`, etc. (these are the custom semantic groups defined in index.css).\n\n5. Specifically inspect these files (which the design doc flagged) and report whether they STILL match the doc's described line numbers/content (the doc may be out of date):\n   - `components/Sidebar.tsx`\n   - `components/layouts/AppShell.tsx`\n   - any file named `LineItemsTable.tsx`, `LineItemRow.tsx`, `BillingHeader.tsx`, `BillingPage.tsx`, `BillingTab.tsx`, `OnboardingStepper.tsx`\n   \n   For each: report actual path, and the current `bg-*`/`border-*`/opacity classes on the lines mentioned in the doc.\n\nReport findings grouped by category. Give me file paths and line numbers. Do NOT edit anything."
}
````

**Output:**

```
<task id="ses_0d2bc0cd4ffeBNZabq51rNDyds" state="completed">
<task_result>
I now have all the data needed. Let me compile the comprehensive findings report.

---

# Color Palette / UI Migration Search Report

**Scope searched:** `apps/desktop/src/renderer/src/` — excluding `components/ui/` (Shadcn), `pages/export/pdf/`, and `DemoReceipts`.

**Baseline note:** `index.css` currently defines domain-specific token groups in addition to the base Shadcn-style tokens: `--onboarding-*` (8 vars, lines 93–100), `--product-*` (7 vars, lines 105–111), `--search-*` (9 vars, lines 114–123), `--invoice-*` (6 vars, lines 126–131), plus `--chart-1..5` (lines 86–90). All are re-exported in `@theme inline` (lines 200–235). The migration doc swaps the `:root` block but keeps the same variable names.

---

## 1. Hardcoded color values in `.tsx` files

These are raw color literals (hex / rgb / rgba / oklch / hsl) sitting in component JS — they **cannot** pick up the palette swap automatically.

### A. True inline color literals (will render wrong after swap)

| File | Line | Value |
|---|---|---|
| `features/onboarding/OnboardingStepper.tsx` | 30 | `"oklch(69.72% 0.209 145.47)"` (motion `animate` backgroundColor, completed) |
| `features/onboarding/OnboardingStepper.tsx` | 32 | `"oklch(87.67% 0.165 90.15)"` (active — **this is the old amber primary**) |
| `features/onboarding/OnboardingStepper.tsx` | 33 | `"oklch(0.967 0.0029 264.5419)"` (inactive — **old `--muted`**) |
| `features/onboarding/OnboardingStepper.tsx` | 36 | `"oklch(69.72% 0.209 145.47)"` (animate borderColor, completed) |
| `features/onboarding/OnboardingStepper.tsx` | 38 | `"oklch(77.55% 0.174 90.04)"` (active border — **old `--ring`**) |
| `features/onboarding/OnboardingStepper.tsx` | 39 | `"oklch(82% 0.006 286.286)"` (inactive border — **old `--border`**) |
| `features/onboarding/OnboardingStepper.tsx` | 56 | `color: isActive ? "oklch(0.2795 0.0368 260.031)" : "oklch(0.551 0.0234 264.3637)"` (**old `--foreground` / `--muted-foreground`**) |
| `features/dashboard/TopProductsChart.tsx` | 15 | `"hsl(140, 25%, 55%)"` (COLORS array, "Soft Sage") |
| `features/dashboard/TopProductsChart.tsx` | 16 | `"hsl(350, 30%, 65%)"` (COLORS array, "Dusty Rose") |

> `TopProductsChart.tsx` COLORS array (lines 11–17) also references `var(--chart-3/4/5)` for the first 3 slices, then falls back to the two hardcoded hsl()s for slices 4–5. So pie slices beyond index 2 use literal colors.

### B. `rgba()` literals embedded inside arbitrary shadow values (borderline — these are shadow tints, not pure colors)

| File | Line | Value |
|---|---|---|
| `features/productDialog/ProductDialog.tsx` | 147 | `shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]` (TabsList) |
| `features/productDialog/ProductDialog.tsx` | 150 | `shadow-[0_2px_12px_rgba(0,0,0,0.06)]` (active tab trigger) |
| `features/productDialog/ProductDialog.tsx` | 157 | `shadow-[0_2px_12px_rgba(0,0,0,0.06)]` (active tab trigger) |
| `features/productDialog/ProductDialog.tsx` | 164 | `shadow-[0_2px_12px_rgba(0,0,0,0.06)]` (active tab trigger) |

> These are alpha-tinted black shadows in arbitrary-value syntax. They are cosmetically tied to the `--shadow-*` token system and may want to be swapped to `shadow-sm`/`shadow-md`, but they will not "break" the palette.

### C. Hardcoded hex in a non-tsx helper (flagged by the doc as "do not change")

| File | Line | Value |
|---|---|---|
| `features/productDialog/productImageCrop.ts` | 4 | `const CANVAS_BACKGROUND = "#ffffff";` |

> This is a `<canvas>` 2D API fill, not a CSS reference. The doc explicitly lists it under "should not change."

### D. Chart config using CSS variables (good — these WILL swap automatically; listed for completeness)

| File | Line | Value |
|---|---|---|
| `features/dashboard/SalesEstimatesChart.tsx` | 22 | `color: "var(--chart-1)"` |
| `features/dashboard/SalesEstimatesChart.tsx` | 26 | `color: "var(--chart-2)"` |

---

## 2. Opacity-tinted surface classes (need post-swap review)

All of these reference a token whose value changes after the swap, so a fixed alpha like `/30` may render with different visual weight against the new warm canvas. Grouped by token.

### `bg-background/NN`
| File | Line | Class |
|---|---|---|
| `components/Sidebar.tsx` | 303 | `bg-background/80 hover:bg-background/90` (store card) |
| `components/layouts/AppShell.tsx` | 68 | `bg-background/95` (header) |
| `features/billing/LineItemsTable.tsx` | 74 | `bg-background/95` (table container) |
| `features/billing/LineItemsTable.tsx` | 75 | `bg-background/95` (toolbar strip) |
| `features/billing/LineItemsTable.tsx` | 122 | `bg-background/80` (toolbar button) |
| `features/billing/LineItemRow.tsx` | 202 | `bg-background/90` (discount button) |
| `features/billing/LineItemRow.tsx` | 231 | `bg-background/80` (action button) |
| `features/billing/LineItemRow.tsx` | 251 | `bg-background/80` (action button) |
| `features/billing/SummaryFooter.tsx` | 118 | `bg-background/60` (footer bar) |
| `features/productDialog/ProductDialog.tsx` | 112 | `bg-background/50` (dialog header) |
| `features/productDialog/ProductHistoryTimeline.tsx` | 118 | `bg-card/50` (note: card, not background) |

### `bg-muted/NN`
| File | Line | Class |
|---|---|---|
| `features/products/ProductHeader.tsx` | 72 | `bg-muted/40` |
| `features/products/ProductHeader.tsx` | 92 | `bg-muted/30` |
| `features/products/ProductHeader.tsx` | 222 | `bg-muted/30` |
| `features/products/ProductHeader.tsx` | 390 | `bg-muted/40` |
| `features/products/ProductListItem.tsx` | 64 | `bg-muted/30` (image thumb) |
| `features/search/SearchDropdown.tsx` | 351 | `bg-muted/50` |
| `features/search/SearchDropdown.tsx` | 453 | `bg-muted/30` (icon container) |
| `features/billing/LineItemRow.tsx` | 96 | `bg-muted/30` (qty control) |
| `features/billing/LineItemRow.tsx` | 184 | `bg-muted/25` (amount display) |
| `features/billing/BillingHeader.tsx` | 201 | `bg-muted/30` (date/time box) |

### `bg-card/NN`
| File | Line | Class |
|---|---|---|
| `features/productDialog/ProductHistoryTimeline.tsx` | 118 | `bg-card/50` |

### `bg-secondary/NN`
| File | Line | Class |
|---|---|---|
| `features/dashboard/MetricCard.tsx` | 50 | `bg-secondary/60` (and `hover:bg-secondary/80`) |
| `features/dashboard/ViewModal.tsx` | 47 | `bg-secondary/30` |
| `features/dashboard/ViewModal.tsx` | 120 | `bg-secondary/10` |
| `features/dashboard/Dashboard.tsx` | 32 | `bg-secondary/90` |
| `features/productDialog/ProductViewMode.tsx` | 36 | `bg-secondary/40` |
| `features/productDialog/ProductViewMode.tsx` | 95 | `bg-secondary/10` |
| `features/productDialog/ProductEditForm.tsx` | 59 | `bg-secondary/40` |
| `features/productDialog/ProductImageCropSelector.tsx` | 192 | `bg-secondary/20` |
| `features/productDialog/ProductTransactionsTable.tsx` | 181 | `bg-secondary/40` |
| `features/productDialog/ProductDialog.tsx` | 147 | `bg-secondary/40` (TabsList) |

### `bg-sidebar/NN`
None found. (`bg-sidebar` itself appears at `components/Sidebar.tsx:198`, full-opacity, no alpha.)

### Other opacity-tinted background tokens (state/brand — also swap-affected)

`bg-primary/`: `Sidebar.tsx:216` (`/10`), `:240` (full); onboarding steps `LocationStep.tsx:90`, `OwnerContactStep.tsx:71`, `StoreIdentityStep.tsx:48` (all `bg-primary/15`); `WelcomeStep.tsx:56` (`bg-primary/10 border-primary/30`); `OnboardingComplete.tsx:86, 97` (`bg-primary/10`); `CustomerSummaryCard.tsx:79` (`bg-primary/15` string prop).

`bg-destructive/`: `ProductHeader.tsx:206` (`border-destructive/40`+`bg-destructive/10`), `:396` (`/10`); `RecentTransactionsTableRow.tsx:90`, `DashboardTableRow.tsx:144`, `CustomerTableRow.tsx:131` (all `border-destructive/20 bg-destructive/10`); `ProductDialog.tsx:199, 223` (`border-destructive/30`+`/10`), `:279` (`bg-destructive/10`); `ProductListItem.tsx:162, 220` (`/10`); `MetricCard.tsx:73` (`bg-destructive/15`); `BillingSaveStatus.tsx:20` (`bg-destructive/15 ring-destructive/25`); `BillingTabBar.tsx:134` (`/10`); `ProductImageCropSelector.tsx:177` (`/10`).

`bg-success/`: `Sidebar.tsx:305` (`bg-success/20`); `RecentTransactionsTableRow.tsx:88`, `DashboardTableRow.tsx:142`, `CustomerTableRow.tsx:129` (`bg-success/10 border-success/20`); `BillingSkeleton.tsx:58` (`border-success/20`); `OnboardingComplete.tsx:58` (`border-success/40`).

`bg-warning/`: `ProductListItem.tsx:95` (`border-warning/30 bg-warning/10`).

`bg-info/`, `bg-accent/`, `bg-foreground/`: scattered — `BillingSaveStatus.tsx:17` (`bg-info/15 ring-info/25`), `:18` (`bg-success/15`), `:19` (`bg-warning/15`); `SearchDropdown.tsx:438` (`bg-foreground/6 ring-foreground/15`); `LineItemsTable.tsx:80` (`hover:bg-muted/60`), etc.

**Dynamic opacity-class generator worth flagging:**
- `utils/index.ts:54` `getCheckStatusColor()` returns `bg-success/25`, `bg-warning/20`, or `bg-background` — consumed in `LineItemRow.tsx:46/53`. Both `/25` and `/20` may need retuning.

---

## 3. Inline `style={{ ... }}` objects that set colors / backgrounds / gradients

**None.** All 12 `style={{}}` occurrences in non-excluded `.tsx` files are layout/transform only:

| File | Lines | Sets only |
|---|---|---|
| `features/products/ProductResults.tsx` | 49, 57 | virtualizer `height`/`position`/`transform` |
| `features/search/SearchDropdown.tsx` | 416, 420 | virtualizer `height`/`transform` |
| `features/transactionDashboard/DashboardTable.tsx` | 51, 59 | virtualizer `height`/`position`/`transform` |
| `features/customers/CustomerTable.tsx` | 72, 81 | virtualizer `height`/`position`/`marginBottom`/`transform` |
| `features/productDialog/ProductViewMode.tsx` | 145 | `overflowWrap` |
| `features/productDialog/ProductEditForm.tsx` | 299 | `overflowWrap` |
| `components/Sidebar.tsx` | 201 | sidebar `width`/`minWidth`/`maxWidth`/`flexBasis` |
| `components/Sidebar.tsx` | 354 | `transformOrigin` |

> The closest thing to "inline color" lives in motion `animate={{}}` props, not `style={{}}` — those are reported in §1.A (`OnboardingStepper.tsx`).

---

## 4. Old domain-specific token usage in components

These all reference the `--onboarding-* / --product-* / --search-* / --invoice-*` variable groups defined in `index.css`. They are NOT hardcoded — they will follow whatever you set those vars to in the new `:root`. Listed so you know every consumer.

### `--onboarding-*` (dark onboarding rail — intentionally dark per doc)
| File | Line | Class |
|---|---|---|
| `features/onboarding/OnboardingFlow.tsx` | 35 | `from-onboarding-gradient-start via-onboarding-gradient-mid to-onboarding-gradient-end bg-linear-to-br` |
| `features/onboarding/OnboardingFlow.tsx` | 53 | `text-onboarding-text-muted` |
| `features/onboarding/OnboardingFlow.tsx` | 68 | `bg-onboarding-icon-bg` |
| `features/onboarding/OnboardingFlow.tsx` | 71 | `text-onboarding-feature-text` |
| `features/onboarding/OnboardingFlow.tsx` | 77 | `text-onboarding-text-footer` |
| `features/onboarding/OnboardingComplete.tsx` | 87 | `text-onboarding-icon-dark` |
| `features/onboarding/OnboardingComplete.tsx` | 98 | `text-onboarding-icon-dark` |
| `features/onboarding/steps/LocationStep.tsx` | 91 | `text-onboarding-icon-dark` |
| `features/onboarding/steps/OwnerContactStep.tsx` | 72 | `text-onboarding-icon-dark` |
| `features/onboarding/steps/StoreIdentityStep.tsx` | 49 | `text-onboarding-icon-dark` |

### `--product-*`
| File | Line | Class |
|---|---|---|
| `features/productDialog/ProductTransactionsTable.tsx` | 139 | `bg-product-badge-bg text-product-badge-text` |
| `features/productDialog/ProductTransactionsTable.tsx` | 167 | `text-product-label` |
| `features/productDialog/ProductTransactionsTable.tsx` | 171 | `text-product-label` |

### `--search-*`
| File | Line | Class |
|---|---|---|
| `components/highlighted-text.tsx` | 12 | `bg-search-highlight` |
| `features/search/SearchDropdown.tsx` | 481 | `border-search-badge-weight-border bg-search-badge-weight-bg text-search-badge-weight-text` |
| `features/search/SearchDropdown.tsx` | 490 | `border-search-badge-mrp-border bg-search-badge-mrp-bg text-search-badge-mrp-text` |

### `--invoice-*`
No usages found in the searched `.tsx` tree (the `--invoice-*` tokens are consumed only inside the excluded `pages/export/pdf/` print templates).

### `--sidebar-*`
| File | Line | Class |
|---|---|---|
| `components/Sidebar.tsx` | 198 | `bg-sidebar text-sidebar-foreground` |
| `components/Sidebar.tsx` | 225 | `text-sidebar-foreground/55` |
| `components/Sidebar.tsx` | 284 | `bg-secondary text-sidebar-foreground` |
| `components/Sidebar.tsx` | 285 | `text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground` |
| `pages/NotFoundPage.tsx` | 15 | `from-primary to-sidebar-primary bg-linear-to-r bg-clip-text text-transparent` (gradient text) |

---

## 5. Doc verification — flagged files

The migration doc is `docs/design-system/08-linear-light-billing-migration.md` (Phase 2, sections 2.1–2.8). Verification of each cited location against the **current** source:

### 2.1 `components/Sidebar.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/components/Sidebar.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 198 | `bg-sidebar` (stays) | Line 198: `"bg-sidebar text-sidebar-foreground relative h-full shrink-0 ... border-r border-r-black/8"` | ✅ matches. **Bonus:** note `border-r-black/8` — a built-in black/opacity border, not a token. |
| 306 | `bg-background/80` → `bg-surface-2/80` | `bg-background/80` is on **line 303** (not 306). Line 306 is `<div className="bg-success/20 text-success ...">MS</div>`. | ⚠️ **Doc is off by 3 lines.** The class exists at line 303: `"border-border bg-background/80 hover:bg-background/90 flex cursor-pointer items-center gap-3 rounded-xl border p-3 backdrop-blur-md ..."`. |

### 2.2 `components/layouts/AppShell.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/components/layouts/AppShell.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 68 | `bg-background/95` (stays) | Line 68: `<header className="bg-background/95 flex h-14 items-center border-b px-6">` | ✅ matches exactly |
| 96 | `bg-muted/40` → `bg-muted/60` | Line 96: `className="bg-muted/40 h-10 pl-12 text-base"` | ✅ matches exactly |

### 2.3 `LineItemsTable.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/features/billing/LineItemsTable.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 74 | `bg-background/95` → `bg-background` | Line 74: `<div className="border-border/70 bg-background/95 relative w-full flex-1 rounded-xl border px-4 pb-4 shadow-lg">` | ✅ matches exactly |
| 75 | `bg-background/95` → `bg-muted/60` | Line 75: `<div className="bg-background/95 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">` | ✅ matches exactly |

### 2.4 `LineItemRow.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/features/billing/LineItemRow.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 53 | `hover:border-border` (stays) | Line 53: `className={`group ${checkedColor} border-border/70 hover:border-border grid w-full items-center rounded-xl border ...`}` | ✅ matches. **Note:** `${checkedColor}` injects `bg-background` / `bg-success/25` / `bg-warning/20` from `utils/index.ts:54`. |
| 96 | `bg-muted/30` → `bg-muted/60` | Line 96: `<div className="bg-muted/30 border-border/70 relative mx-auto flex h-10 w-full items-center rounded-lg border font-bold">` | ✅ matches exactly |
| 186 | `bg-muted/25` → `bg-muted/40` | `bg-muted/25` is on **line 184** (not 186). Line 186 is `</div>`. | ⚠️ **Doc is off by 2 lines.** Class at line 184: `<div className="bg-muted/25 border-border/70 text-foreground flex h-full w-full items-center justify-end rounded-lg border px-3 pl-8 ...">` |

### 2.5 `BillingHeader.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/features/billing/BillingHeader.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 170 | `bg-card border-border/60` (stays) | Line 170: `<div className="bg-card border-border/60 mx-4 my-2 flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">` | ✅ matches exactly |

### 2.6 `BillingPage.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/pages/billing/BillingPage.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 125 | `bg-background-secondary` (stays) | Line 125: `<div className="bg-background-secondary relative flex h-full flex-1 flex-col">` | ✅ matches exactly |

### 2.7 `BillingTab.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/features/billing/tabs/BillingTab.tsx`

| Doc line | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| 47 | `bg-background-secondary` → `bg-surface-1` | Line 47: `? "bg-background-secondary text-foreground z-10 -mb-px"` | ✅ matches exactly |

### 2.8 `OnboardingStepper.tsx`
Path: `/mnt/data/code/projects/pos_tree/dev/apps/desktop/src/renderer/src/features/onboarding/OnboardingStepper.tsx`

| Doc ref | Doc claim | ACTUAL current | Status |
|---|---|---|---|
| lines 30–39, 56 | Inline `animate` prop oklch values | Lines 28–40: `animate={{ backgroundColor: ..., borderColor: ... }}` with oklch on 30, 32, 33, 36, 38, 39. Line 56: `animate={{ color: isActive ? "oklch(0.2795 0.0368 260.031)" : "oklch(0.551 0.0234 264.3637)" }}` | ✅ matches exactly |

---

## Summary of doc accuracy

- **6 of 8 sections** (2.2, 2.3, 2.5, 2.6, 2.7, 2.8) match the cited line numbers exactly.
- **2 sections have stale line numbers** but the cited classes still exist verbatim, just shifted:
  - **§2.1 Sidebar.tsx**: `bg-background/80` is at **line 303**, not 306.
  - **§2.4 LineItemRow.tsx**: `bg-muted/25` is at **line 184**, not 186.
- No class strings cited by the doc have been renamed or removed.

## Items the doc did NOT flag but you should consider

1. **`utils/index.ts:54` `getCheckStatusColor()`** — dynamically returns `bg-success/25` / `bg-warning/20` / `bg-background`. Both opacity-tinted; same retuning concern as `LineItemRow`.
2. **`features/dashboard/TopProductsChart.tsx:15-16`** — two hardcoded `hsl()` pie-slice colors not mentioned anywhere in the doc.
3. **`features/search/SearchDropdown.tsx:318`** — `ring-1 ring-black/6` (built-in `black` at 6%, not a token).
4. **`components/Sidebar.tsx:198`** — `border-r-black/8` (built-in `black` at 8%, not a token).
5. **`features/onboarding/OnboardingFlow.tsx:44, 49`** — `text-white` on the dark onboarding rail (intentional, but it's a raw built-in color).
6. **`pages/NotFoundPage.tsx:15`** — gradient text `from-primary to-sidebar-primary ... text-transparent` (uses tokens, so it will swap, but worth visually verifying).
7. **`features/productDialog/ProductDialog.tsx:147, 150, 157, 164`** — four `rgba(0,0,0,...)` literals inside arbitrary `shadow-[...]` values; tied to shadow system but not tokenized.
8. **`features/productDialog/productImageCrop.ts:4`** — `#ffffff` canvas fill (doc explicitly says leave it).
</task_result>
</task>
```

---

## Assistant (Plan · GLM-5.2 · 24.7s)

_Thinking:_

I now have a comprehensive understanding. Let me also check if there's an existing migration doc structure to follow, and look at the docs/design-system directory.

Actually, I have enough information now. The user wants me to CREATE a concise doc. But I'm in Plan Mode (READ-ONLY), so I MUST NOT create files. I should present a plan instead.

Wait, let me re-read the instructions. The system reminder says:
"CRITICAL: Plan mode ACTIVE - you are in READ-ONLY phase. STRICTLY FORBIDDEN: ANY file edits, modifications, or system changes."

And: "The user indicated that they do not want you to execute yet"

So I cannot create the doc file. I need to present a plan to the user. But the user explicitly asked me to "create a concise doc".

Given the conflict, the right approach is to present the plan/roadmap as my response output (text), and offer to write it to a file once they exit plan mode. The user can review the roadmap in my response.

Actually, let me reconsider. The user wants a roadmap doc. I should present the roadmap content in my response so they can review it, and ask if they want me to write it to a file (e.g., a new doc in docs/design-system/).

Let me also quickly check what's in docs/design-system to place the new doc appropriately and match conventions.

Let me check the design-system docs folder.

Let me check the existing design-system docs to match conventions for where this new roadmap should live.

**Tool: read**

**Input:**

```json
{
  "filePath": "/mnt/data/code/projects/pos_tree/dev/docs/design-system"
}
```

**Output:**

```
<path>/mnt/data/code/projects/pos_tree/dev/docs/design-system</path>
<type>directory</type>
<entries>
01-trust-clarity.md
02-warm-retail.md
03-modern-monochrome.md
04-thermal-print.md
08-linear-light-billing-migration.md
5-linear-design.md
6-linear-light.md
7-linear-light-product.md
README.md

(9 entries)
</entries>
```

---

## Assistant (Plan · GLM-5.2 · 68.9s)

_Thinking:_

There's a numbered series. The migration guide is `08-linear-light-billing-migration.md`. A roadmap doc for the migration agent would naturally be `09-...` or similar. Let me check the README quickly to understand the convention.

Actually I have enough. I'm in plan mode so I cannot write the file. I'll present the roadmap as my response and offer to write it to a file. Let me present a concise, phase-wise roadmap.

Let me structure the roadmap well. The user wants:

1. A concise doc of the frontend structure
2. A roadmap for the migration agent to travel around in phases
3. Phase-wise separation between react components
4. Reference the design doc (08-linear-light-billing-migration.md)

I have all the data. Let me build the roadmap. The design doc has Phase 1 (CSS swap) and Phase 2 (component adjustments). But the user wants a more granular phase-wise separation of the React components for the migration agent to travel through.

I should propose phases that:

- Phase 0/1: Foundation — CSS variable swap (the design doc's Phase 1)
- Phase 2: Shell/layout layer (Sidebar, AppShell, RootLayout, App.tsx wrapper)
- Phase 3: Simple leaf pages (Home, Reports, NotFound)
- Phase 4: Products feature + ProductDialog
- Phase 5: Customers feature
- Phase 6: Dashboard + TransactionDashboard + charts
- Phase 7: Settings
- Phase 8: Search (global search dropdown)
- Phase 9: Billing (most complex — LineItemsTable, LineItemRow, BillingHeader, tabs, SummaryFooter, etc.)
- Phase 10: Onboarding (dark rail — separate palette, last)
- Phase 11: Final verification / polish

Each phase should list the components, the migration work (palette swap auto-applies + manual adjustments flagged), and dependencies.

Let me write this up concisely. Since I'm in plan mode, I'll present it as text and ask if they want it written to a file.

Let me draft the roadmap content. I want it concise but complete.

I'll present this as my "plan" / proposed document content, and ask the user where they'd like it saved (or whether they want me to write it at all, since plan mode forbids edits).

Let me think about the dependency ordering more carefully:

Foundation:

- `main.tsx` (imports index.css)
- `App.tsx` (`<div className="bg-background-secondary">` wrapper — token auto-swaps)
- `index.css` (the swap itself)

Shell (everything depends on this):

- `RootLayout.tsx` (gate, minimal styling)
- `AppShell.tsx` (header bg-background/95 stays, search bg-muted/40 → /60)
- `Sidebar.tsx` (bg-sidebar stays, store card bg-background/80 → bg-surface-2/80, border-r-black/8)

Then leaf pages in increasing complexity:

1. Home (HomePage) — simple
2. Reports (ReportsPage)
3. NotFound (gradient text, uses tokens)
4. Products (ProductHeader, ProductListItem, ProductResults) + ProductDialog (ProductDialog, ProductEditForm, ProductViewMode, ProductImageCropSelector, ProductHistoryTimeline, ProductTransactionsTable, StatusIndicator)
5. Customers (CustomerLayout, CustomerSidebar, CustomerTable, CustomerTableRow, CustomerDetails, CustomerSummaryCard, CustomerTypeColor, CustomerDialog)
6. Dashboard (DashboardPage, Dashboard, MetricsComponent, MetricCard, StatCard, ItemRow, TopProductsChart, SalesEstimatesChart, RecentTransactionsTable, RecentTransactionsTableRow, ViewModal) + TransactionDashboard (DashboardTable, DashboardTableRow, DashboardCard, DateRangePicker)
7. Settings (SettingsPage, SettingsSections, SettingsField, settingsNavigation)
8. Search (SearchDropdown, MemoizedSearchDropDown, highlighted-text)
9. Billing (BillingPage, BillingHeader, LineItemsTable, LineItemRow, CustomerInputBox, ProductDailogWrapper, QuantityPresets, SummaryFooter, BillingSaveStatus, BillPreview, BillingSkeleton, tabs/BillingTabBar, tabs/BillingTab) — most complex, debounced sync
10. Onboarding (OnboardingFlow, OnboardingStepper, OnboardingComplete, steps/\*) — dark rail, separate palette

Plus shared util `utils/index.ts getCheckStatusColor()` flagged.

I'll present this as a clean phased roadmap. Let me write the response. Since I must present a plan in plan mode, I'll output the proposed doc content and ask the user to confirm before I write it.

Given the output should be concise but this is a doc the user explicitly requested to be created, I'll present the full roadmap content in my response. I'll keep it tight.

Let me write it.

I have everything I need. I'm in plan mode so I can't write the file yet — below is the proposed roadmap doc content for your review. Tell me if it looks right and where to save it (I'd suggest `docs/design-system/09-linear-light-migration-roadmap.md`), then I'll write it on your go-ahead.

---

# Linear-Light Migration — Component Roadmap

A phase-wise travel map for the migration agent. The palette swap is one CSS edit (`index.css`); this doc orders the **React components** so the agent moves from foundation → shell → leaves → complex features, retuning opacity tints and hardcoded values as it goes.

> **Golden rule:** ~95% of components need **zero className changes**. After the `:root` swap, walk each phase and visually verify, then patch only the flagged items.

## How to read each phase

- **Token auto-swap** = works automatically, just verify.
- **Manual** = flagged edit (opacity retune, hardcoded color, doc drift).
- **Depends on** = must be done after the listed phases.

---

## Phase 0 — Foundation (the swap)

**Files:** `src/index.css`, `src/main.tsx`, `src/App.tsx`

- Replace entire `:root` block per design doc §"Token Migration".
- Add `font-size: 14px; font-weight: 500;` to `body` in `@layer base`.
- `@theme inline` and `@font-face` blocks: **no changes**.
- `App.tsx` wrapper `<div className="bg-background-secondary">`: token auto-swaps.
- **Verify:** warm canvas, lavender primary, charcoal text, dim sidebar.

## Phase 1 — App Shell (every page depends on this)

**Files:** `components/layouts/RootLayout.tsx`, `components/layouts/AppShell.tsx`, `components/Sidebar.tsx`

- `AppShell.tsx:68` `bg-background/95` — stays. `:96` `bg-muted/40` → `bg-muted/60`.
- `Sidebar.tsx:198` `bg-sidebar` stays; `:303` `bg-background/80` → `bg-surface-2/80` (doc said line 306 — **off by 3**).
- Flag: `Sidebar.tsx:198` `border-r-black/8` uses raw black, consider `border-border`.
- `RootLayout.tsx`: spinner + onboarding gate, minimal styling — verify only.

## Phase 2 — Leaf Pages (low risk, quick wins)

**Files:** `pages/home/HomePage.tsx`, `pages/reports/ReportsPage.tsx`, `pages/NotFoundPage.tsx`

- Mostly token-driven. Verify only.
- `NotFoundPage.tsx:15` gradient text `from-primary to-sidebar-primary` — swaps, verify contrast.

## Phase 3 — Products + Product Dialog

**Pages:** `pages/products/ProductsPage.tsx`
**Features:** `features/products/*` (ProductHeader, ProductListItem, ProductResults), `features/productDialog/*` (ProductDialog, ProductEditForm, ProductViewMode, ProductImageCropSelector, ProductHistoryTimeline, ProductTransactionsTable, StatusIndicator)

- Opacity retunes: `ProductHeader.tsx` (4× `bg-muted/30` & `/40`), `ProductListItem.tsx:64` `bg-muted/30`.
- `bg-secondary/NN` tints across ProductDialog subtree (7 spots) — verify, retune if low-contrast.
- `ProductDialog.tsx:147,150,157,164` — arbitrary `shadow-[..._rgba(0,0,0,...)]`; consider `shadow-sm/md`.
- `--product-*` domain tokens auto-swap via index.css.
- `productImageCrop.ts:4` `#ffffff` canvas fill — **leave** (not CSS).

## Phase 4 — Customers

**Page:** `pages/customers/CustomersPage.tsx`
**Features:** `features/customers/*` (CustomerLayout, CustomerSidebar, CustomerTable, CustomerTableRow, CustomerDetails, CustomerSummaryCard, CustomerTypeColor, CustomerDialog)

- `CustomerTableRow.tsx:131` status pill `border-destructive/20 bg-destructive/10` — verify.
- `CustomerSummaryCard.tsx:79` `bg-primary/15` — verify against lavender.
- No hardcoded colors; token-driven.

## Phase 5 — Dashboard + Transaction Dashboard

**Pages:** `pages/dashboard/DashboardPage.tsx`, `Dashboard.tsx`
**Features:** `features/dashboard/*`, `features/transactionDashboard/*`

- `MetricCard.tsx:50` `bg-secondary/60 hover:bg-secondary/80` — retune.
- `Dashboard.tsx:32` `bg-secondary/90`, `ViewModal.tsx` (`/30`, `/10`) — verify.
- Charts: `SalesEstimatesChart.tsx` uses `var(--chart-1/2)` (auto-swap ✓). `TopProductsChart.tsx:15-16` has **two hardcoded `hsl()`** pie colors — manual fix to palette.
- `RecentTransactionsTableRow` / `DashboardTableRow` status pills — verify.

## Phase 6 — Settings

**Page:** `pages/settings/SettingsPage.tsx`
**Features:** `features/settings/*` (SettingsSections, SettingsField, settingsNavigation)

- Token-driven, verify nested-route nav active states.

## Phase 7 — Global Search

**Features:** `features/search/*` (SearchDropdown, MemoizedSearchDropDown), `components/highlighted-text.tsx`

- `SearchDropdown.tsx:351` `bg-muted/50`, `:453` `bg-muted/30` — retune.
- `SearchDropdown.tsx:318` `ring-black/6` — raw black, consider `ring-border`.
- `--search-*` domain tokens auto-swap; verify weight/MRP badges.

## Phase 8 — Billing (most complex — do late)

**Page:** `pages/billing/BillingPage.tsx`
**Features:** `features/billing/*` incl. `tabs/`

- `BillingPage.tsx:125` `bg-background-secondary` stays.
- `LineItemsTable.tsx:74` `bg-background/95` → `bg-background`; `:75` → `bg-muted/60`; `:122` `bg-background/80` verify.
- `LineItemRow.tsx:96` `bg-muted/30` → `/60`; `:184` `bg-muted/25` → `/40` (doc said line 186 — **off by 2**); `:202,:231,:251` `bg-background/90,/80,/80` verify.
- `SummaryFooter.tsx:118` `bg-background/60` verify.
- `BillingHeader.tsx:170` `bg-card border-border/60` stays.
- `tabs/BillingTab.tsx:47` `bg-background-secondary` → `bg-surface-1`.
- `BillingSaveStatus.tsx` info/success/warning/destructive rings — verify semantic colors.
- **Shared util:** `utils/index.ts:54` `getCheckStatusColor()` returns `bg-success/25` / `bg-warning/20` / `bg-background` — retune opacities (consumed by LineItemRow).
- Note: billing sync is debounced; visual-only changes, no logic edits.

## Phase 9 — Onboarding (dark rail, separate palette — last)

**Features:** `features/onboarding/*` (OnboardingFlow, OnboardingStepper, OnboardingComplete, `steps/*`)

- `--onboarding-*` tokens are **intentionally dark** — auto-swap, verify.
- `OnboardingStepper.tsx:30-39,56` — **7 inline oklch literals** in motion `animate` props (old amber primary, foreground, muted, border, ring). **Manual fix:** extract to `STEP_COLORS` constant (design doc §2.8 Option A) synced to lavender.
- Steps use `bg-primary/15`, `text-onboarding-icon-dark` — verify.

## Phase 10 — Verification & Polish

- Run full checklist from design doc §"Verification Checklist".
- Cross-check: `pnpm typecheck && pnpm lint`.
- Manual smoke: every route in `routes.tsx`, billing create+edit, onboarding fresh-launch, search, dashboard charts, print/PDF untouched.
- **Do not touch:** `pages/export/pdf/PdfInvoicePage.tsx`, `components/ui/*`, `DemoReceipts`, `productImageCrop.ts`.

---

### Doc-accuracy notes for the agent

The design doc `08-...md` is mostly accurate but **2 line refs drifted**:

- §2.1 Sidebar `bg-background/80` → actual **line 303** (doc: 306).
- §2.4 LineItemRow `bg-muted/25` → actual **line 184** (doc: 186).

### Doc-undocumented hotspots the agent must also handle

- `utils/index.ts:54` `getCheckStatusColor()` — opacity-tinted status helper.
- `TopProductsChart.tsx:15-16` — two hardcoded `hsl()` pie colors.
- Raw `black/NN` borders/rings in `Sidebar.tsx:198`, `SearchDropdown.tsx:318`.
- `ProductDialog.tsx` — 4× arbitrary `rgba()` shadow values.
