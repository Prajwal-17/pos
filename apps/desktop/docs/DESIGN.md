# QuickCart desktop design system

## Counter Ledger

QuickCart is a compact operating workspace for a shop counter. The visual language extends the existing mustard-and-black identity: charcoal controls and text, crisp white work surfaces, a warm neutral canvas, solid borders, and mustard reserved for identity, selection, and high-value highlights.

The interface should feel stable and workmanlike. It favors scan speed, keyboard flow, and visible data over decorative space. Shadows belong primarily to overlays. Transparency must never be required to distinguish important text, borders, or state.

## Supported display contract

The provisional release baseline is a **1280 × 650 effective CSS viewport at 100% Electron zoom**. The supported fallback is **1024 × 600**. Comfortable desktop checks use 1366 × 700, 1600 × 900, and 1920 × 1080.

The final baseline must be calibrated on the shop laptop by recording:

- `window.innerWidth` and `window.innerHeight`
- `window.devicePixelRatio`
- Electron zoom factor at the 100% preference
- OS display scaling and display work area

Electron zoom is an accessibility preference, not a layout system. The supported range is 85%–125%, with 100% recommended.

## Density contract

| Element                      |                                  Size |
| ---------------------------- | ------------------------------------: |
| Application header           |                                  48px |
| Sidebar                      | 232px default; 216–280px resize range |
| Sidebar navigation row       |                                  40px |
| Default control              |                                  36px |
| Compact control              |                                  32px |
| Exceptional workflow control |                                  40px |
| Billing row                  |                                  42px |
| Standard table row           |                               40–44px |
| Product list row             |                                  56px |
| Page and panel padding       |                                  12px |
| Common / section gap         |                            8px / 12px |
| Body / secondary text        |                        14px / 12–13px |
| Page title                   |                                  18px |
| Financial total              |                               20–24px |

These values are semantic CSS custom properties in `src/renderer/src/index.css`. Shared primitives consume them; pages should not reintroduce routine `h-10`, `h-12`, large type, or 24px card padding.

## Palette

| Role                       | Value                             |
| -------------------------- | --------------------------------- |
| Canvas                     | `#F4F3EF`                         |
| Working surface            | `#FFFFFF`                         |
| Secondary / strong surface | `#ECEAE3` / `#E2DFD5`             |
| Standard / strong border   | `#C9C5B8` / `#AAA596`             |
| Main / muted / subtle ink  | `#1D1E1B` / `#4B4E46` / `#696C63` |
| Primary action / hover     | `#292B26` / `#171815`             |
| QuickCart brand / soft     | `#DFC832` / `#F4EDB5`             |
| Brand text                 | `#3A3300`                         |

Success stays green, warning amber, destructive brick red, and information steel blue. Mustard does not replace success and is not the default background for every action.

Charts use mustard, green, terracotta, steel, and charcoal. Invoice and receipt colors remain isolated under invoice-only tokens so screen-theme changes do not alter print output.

## Component rules

- Use 36px controls by default, 32px for dense secondary actions, and 40px only for a primary workflow action or financial input.
- Cards use 12px padding and 8px radii by default.
- Dialogs use 16px padding and must fit within the available 600–650px content height.
- Use two meaningful border levels: normal content borders and stronger app-frame/input borders.
- Table headers use 12px semibold labels; rows use 14px values and tabular figures.
- Product and customer names truncate in their normal row instead of changing its expected height.
- Hover-only actions must also appear on focus or selection.
- Motion is brief feedback, normally 120–180ms. Avoid movement in repetitive operating controls.

## Billing workspace

At 1280 × 650 with the receipt preview collapsed, the workspace must show billing tabs, transaction context, the line-item toolbar, table header, at least six useful rows, and the stable total / Save & Print bar.

The line-item grid uses semantic columns: actions, product, quantity, price, amount, checked, and optional count controls. The product column expands with `minmax()`; numeric controls use practical fixed widths. The receipt preview defaults closed at shop-sized viewports and remembers the operator preference.

## Verification

Check every route at 1024 × 600, 1280 × 650, 1366 × 700, 1600 × 900, and 1920 × 1080; then check Electron zoom at 90%, 100%, and 110%. Include empty/loading/error/populated states, long names, large rupee values, dialogs, billing preview states, count-column states, keyboard entry, virtualized scrolling, PDF export, and print output.
