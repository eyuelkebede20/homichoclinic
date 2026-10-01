# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

A simple CRUD-based **clinic management system**. Most of it is standard: patients, visits, lab, pharmacy, testing, billing. The one thing that makes it different is the **per-patient discount**, which works like a promo code:

- When a patient is registered, they are assigned a **discount percentage** (e.g. 50%, 99%).
- The **Manager** can adjust it at any time.
- The **Cashier** applies it automatically at checkout.
- An automated cronjob will eventually adjust it too (**deferred**, see [Cron / Automation](#cron--automation)).

Keep it simple. Prefer boring, readable CRUD over clever abstractions.

## Tech Stack (assumed; change here if different)

- **Framework:** Next.js (App Router) + TypeScript
- **Auth:** Better Auth (with its access-control / RBAC plugin)
- **Database:** PostgreSQL + Prisma
- **Validation:** Zod (shared between client forms and server actions)
- **UI:** Tailwind + shadcn/ui
- **Scheduling:** deferred, see below

## Roles & Permissions (RBAC)

Roles are managed by the **Admin** through Better Auth's access control. Permissions are checked **server-side on every action**; hiding a button in the UI is never enough.

| Role           | Can do                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Admin**      | Manage users, roles and privileges. View audit logs. Full system config.                                        |
| **Manager**    | Set/adjust patient discount %. View billing and inventory reports.                                              |
| **Reception**  | Register patients (including initial discount assignment if allowed by config), edit demographics, book visits. |
| **Cashier**    | Create invoices, apply the patient's discount, take payment. **Read-only** on discount %.                       |
| **Doctor**     | View/write patient history, request lab tests, write prescriptions.                                             |
| **Laboratory** | View lab requests, enter/finalize results.                                                                      |
| **Testing**    | Same pattern as Laboratory for diagnostic tests (imaging, ECG, etc.).                                           |
| **Pharmacy**   | Dispense prescriptions, manage inventory.                                                                       |

Define permissions as `resource:action` pairs (e.g. `patient:create`, `discount:update`, `inventory:adjust`) in one central file. Roles map to permission sets. Never hardcode role names in feature code; check permissions.

## Core Feature: Patient Discount

**Storage:** `Patient.discountPercent`, an integer from `0` to `99`. Default `0`.

**Who can change it:** Manager (and Admin) only. Cashier and other roles can read it, not write it.

**UI:** A slider in the manager's patient view, with quick-pick options in **5% increments** (0, 5, 10 … 95) plus manual fine-tune up to 99. Server validates the range regardless of UI.

**Checkout rules:**

1. Use **integer minor units** (cents/santim) for all money. Never floats.
2. Discount is applied **server-side** when the invoice is computed; never trust a client-supplied total.
3. **Snapshot** the discount onto the invoice (`invoice.discountPercentApplied`). Later changes to the patient's discount must never rewrite past invoices.
4. Rounding: round the discount amount half-up to the nearest minor unit, and keep the rule in one helper function.
5. Which line items are discountable (consultation, lab, tests, pharmacy) is **not decided yet**. Default: discount applies to the whole invoice. Keep this behind one function (`getDiscountableTotal`) so it's easy to change.

**Audit:** Every discount change writes an audit record: who, when, old value, new value, reason (optional).

## Cron / Automation

**Deferred.** Automatic discount adjustment (loyalty rules, expiry, etc.) is intentionally _not_ being built yet.

- The owner will define the behavior later in a **`cron.md`** file in the repo root.
- **When `cron.md` exists, read it before touching anything cron-related.**
- Until then: don't invent adjustment rules, and don't add a scheduler. It's fine to keep discount changes going through a single service function (e.g. `setPatientDiscount(patientId, percent, actor)`) so the cron can reuse it later with a `system` actor.

## Modules

- **Patients:** registration, demographics, discount, search.
- **Patient history:** visits, diagnoses, notes, allergies, prescriptions. Append-friendly; edits are versioned or audited.
- **Record digitization (paper-trail encoding):** for clinics moving paper records into the system. Supports manual data entry of historical records with a `source: "paper_import"` flag, an optional scan/photo attachment linked to the record, the original record date (separate from the entry date), and who entered it. Bulk entry should be fast (keyboard-friendly forms).
- **Laboratory:** test catalog, requests from doctors, results entry, status flow (`requested → in_progress → completed`).
- **Testing:** same pattern as lab for diagnostic tests.
- **Pharmacy & inventory:** drug catalog, **stock by batch** (batch number, expiry date, quantity, cost), stock movements (receive, dispense, adjust, expire/waste), low-stock and near-expiry alerts, dispense against prescriptions. Dispensing consumes the earliest-expiring batch first (FEFO). Stock is never edited directly; every change is a movement record.
- **Billing:** invoices, line items, discount snapshot, payments, receipts.
- **Admin:** user management, role/permission assignment, audit log viewer.

## Data Model (outline)

`User`, `Role`, `Permission`, `Patient` (`discountPercent`), `Visit`, `MedicalRecord` (`source`, `originalDate`, `attachments`), `LabTest`, `LabRequest`, `LabResult`, `Drug`, `StockBatch`, `StockMovement`, `Prescription`, `PrescriptionItem`, `Invoice` (`discountPercentApplied`), `InvoiceItem`, `Payment`, `AuditLog`.

Use soft deletes (`deletedAt`) for clinical and financial data. Never hard-delete patient records, invoices, or stock movements.

## Security & Privacy

This is medical data. Treat it as sensitive by default.

- Enforce permissions server-side; deny by default.
- Log access to and changes of patient records (`AuditLog`).
- Never log PHI (names, diagnoses) to console or error trackers.
- Validate all input with Zod on the server.
- Secrets in environment variables only; never commit `.env`.
- Uploaded scans: validate type and size, store outside the public web root or behind signed URLs.

## Code Conventions

- TypeScript strict mode. No `any` without a comment explaining why.
- Feature-based folders: `src/features/<module>/{actions,components,schemas,queries}`.
- Server actions or route handlers do: authenticate → authorize → validate → act → audit.
- Keep business rules (discount calc, stock deduction, permission checks) in plain functions with unit tests, separate from UI and database code.
- Small, focused commits. Migrations are committed and never edited after merge.

## Commands

```bash
pnpm install          # install deps
pnpm dev              # run dev server
pnpm db:migrate       # run Prisma migrations
pnpm db:seed          # seed roles, permissions, demo data
pnpm test             # unit tests
pnpm lint && pnpm typecheck
```

(Adjust to match `package.json` once scaffolded.)

## Working Agreements for Claude

- **Ask before assuming** on anything money-related, permission-related, or clinical-data-related.
- Don't build features outside the scope above (e.g. appointments calendar, insurance claims, telemedicine) unless asked.
- Don't implement the cronjob until `cron.md` exists and the owner says to.
- When adding a feature, add the permission for it first, then the code.
- If something here conflicts with what the code does, say so and ask; don't silently pick one.

## Open Questions

- Which invoice line items are discountable?
- Can Reception set the _initial_ discount at registration, or is that Manager-only?
- Currency and tax handling?
- Cron behavior for discount adjustment (to be defined in `cron.md`).
- Single clinic or multi-branch?

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
