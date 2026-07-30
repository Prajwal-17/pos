# Product

<!-- impeccable:product-schema 1 -->

## Platform

Desktop (Electron on Windows)

## Users

QuickCart is personal desktop software for a shop operator who bills customers quickly at the
counter. The developer also uses prototype-only diagnostic surfaces to test hardware integrations
before adopting them in the shop workflow.

## Product Purpose

QuickCart is an offline-first Electron billing application for managing products, customers,
sales, estimates, invoices, and shop operations. Success means billing remains fast and dependable
on the shop computer, historical transactions remain accurate, and hardware-sensitive workflows
can be verified safely before production use.

## Positioning

QuickCart keeps billing data and day-to-day shop workflows local while preserving immutable
transaction snapshots and providing purpose-built operational interfaces.

## Operating Context

- The application is used repeatedly at a shop counter with keyboard and mouse.
- Billing changes are synchronized before navigation, printing, PDF export, or other final actions.
- The current thermal-printing prototype targets one Everycom 80mm, 203 DPI Windows printer with an
  approximately 576-dot printable width.
- Printing experiments must be usable from packaged Windows prototype builds, not only the local
  development server.

## Capabilities and Constraints

- Renderer server state uses TanStack Query; client-only workflow state uses Zustand.
- Native printer access crosses the context-isolated Electron preload bridge.
- Money is stored as integer paisa and fractional quantities as integer milli-units.
- Standard receipts may use raw ESC/POS commands; rich or Kannada receipts may require bitmap
  rendering through the Windows printer driver or a supported raw raster command.
- The printing playground is an isolated prototype-branch development tool and is not a production
  commitment.
- Renderer routing uses a hash router for packaged `file://` compatibility.

## Brand Commitments

The product is named QuickCart. Its interface is compact, practical, keyboard-friendly, and
operational rather than promotional. Existing invoice and receipt styling remains isolated from the
screen theme.

## Evidence on Hand

- `README.md` and `apps/desktop/README.md` describe the repository and desktop runtime.
- `DESIGN.md` is the canonical visual and interaction contract.
- Existing raw ESC/POS and Windows image-print prototypes live under
  `apps/desktop/src/main/ipcHandlers/printHandlers/`.
- The current receipt preview and billing print actions provide real shop data and workflows for
  testing.

## Product Principles

1. Keep the common billing path fast and stable.
2. Treat persisted transaction data as the source of truth.
3. Isolate native hardware access from renderer code.
4. Prefer deterministic behavior and explicit status over hidden automation.
5. Prototype risky printer behavior away from the production billing flow.

## Accessibility & Inclusion

Operational interfaces must remain keyboard-usable with visible focus, explicit labels, readable
contrast, and non-color status feedback. Receipt experiments include Kannada and bitmap output to
evaluate regional-language support on the target printer.
