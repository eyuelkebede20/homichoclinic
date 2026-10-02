# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

A simple CRUD-based **clinic management system**. Most of it is standard: patients, visits, lab, pharmacy, testing, billing. The one thing that makes it different is the **per-patient dynamic discount**:

- When a patient is registered, they can be assigned to a specific civilian segment based on their Hired Year (using the Ethiopian Calendar).
- Their **discount percentage** dynamically increases based on their tenure.
- The **Manager** can adjust/verify it.
- The **Cashier** receives a seamless unbilled queue and with one click generates invoices where this discount is applied automatically.
- A **yearly Vercel cronjob** automatically increments tenure and recalculates discounts annually.

Keep it simple. Prefer boring, readable CRUD over clever abstractions.

## Tech Stack (assumed; change here if different)

- **Framework:** Next.js (App Router) + TypeScript
- **Auth:** Better Auth (with its access-control / RBAC plugin)
- **Database:** PostgreSQL + Prisma
- **Validation:** Zod (shared between client forms and server actions)
- **UI:** Tailwind + shadcn/ui
- **Scheduling:** Vercel Cron

## Roles & Permissions (RBAC)

Roles are managed by the **Admin** through Better Auth's access control. Permissions are checked **server-side on every action**; hiding a button in the UI is never enough.

| Role           | Can do                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Admin**      | Manage users, roles, system limits (OPD rooms), and clinic profile (Name/Logo). View logs.                      |
| **Manager**    | Manage patient demographics and view reports.                                                                   |
| **Reception**  | Register patients, edit demographics, book visits.                                                              |
| **Cashier**    | View the unbilled queue, 1-click generate invoices with discounts applied, take payments, auto-print receipts.  |
| **Doctor**     | View/write patient history, request lab tests, write prescriptions.                                             |
| **Laboratory** | View lab requests, enter/finalize results. Manage Lab catalog.                                                  |
| **Testing**    | Same pattern as Laboratory for diagnostic tests (imaging, ECG, etc.).                                           |
| **Pharmacy**   | Dispense prescriptions, manage inventory. Manage Drug catalog.                                                  |

Define permissions as "resource:action" pairs (e.g. "patient:create", "discount:update", "inventory:adjust") in one central file. Roles map to permission sets. Never hardcode role names in feature code; check permissions.

## Core Feature: Patient Discount

**Storage:** "Patient.discountPercent", an integer from "0" to "100". Also stores "hiredYearEC" for dynamic calculation.

**Who can change it:** Manager (and Admin) only. Cashier and other roles can read it, not write it.

**UI:** A slider in the manager's patient view, with quick-pick options in **5% increments** plus manual fine-tune up to 100. Server validates the range regardless of UI.

**Checkout rules:**

1. Use **integer minor units** (cents/santim) for all money. Never floats.
2. Discount is applied **server-side** when the invoice is computed; never trust a client-supplied total.
3. **Snapshot** the discount onto the invoice ("invoice.discountPercentApplied"). Later changes to the patient's discount must never rewrite past invoices.
4. Rounding: round the discount amount half-up to the nearest minor unit, and keep the rule in one helper function.
5. Discount applies to the whole invoice automatically via the Cashier's "/api/billing/generate-auto-invoice" action.

**Audit:** Every discount change writes an audit record: who, when, old value, new value, reason (optional).

## Cron / Automation

The Dynamic Discount adjustment is powered by a Vercel Cron Job running once a year ("/api/cron/yearly-discount"). 
- It pulls all patients missing a fixed static discount, calculates their tenure based on "hiredYearEC", sets the appropriate scalar, and updates "discountPercent".

## Modules

- **Patients:** registration, demographics, EC dynamic discount, search.
- **Patient history:** visits, diagnoses, notes, allergies, prescriptions. 
- **Clinic Routing (OPD):** True load-balancer algorithm assigning new auto-visits to the active OPD room with the fewest currently queued patients.
- **Record digitization (paper-trail encoding):** for clinics moving paper records into the system. Supports manual data entry of historical records with a "source: 'paper_import'" flag.
- **Laboratory:** test catalog with layout-optimized availability toggles, requests from doctors, results entry.
- **Pharmacy & inventory:** drug catalog, stock movements, dispense against prescriptions.
- **Billing:** centralized Cashier workflow. The Cashier views a unified real-time Unbilled Queue, groups items into invoices, takes payment, and triggers auto-print receipts. Fully searchable by Name or Phone.
- **Admin:** user management, role/permission assignment, audit log viewer, and global Clinic Profile config (Name & Logo).

## Data Model (outline)

"User", "Role", "Permission", "Patient" ("discountPercent", "hiredYearEC"), "Visit" ("opdRoom"), "MedicalRecord" ("source"), "LabTest", "LabRequest", "LabResult", "Drug", "StockBatch", "StockMovement", "Prescription", "PrescriptionItem", "Invoice" ("discountPercentApplied"), "InvoiceItem", "Payment", "AuditLog", "SystemSetting" ("clinicName", "clinicLogo", "activeOpdRooms").

Use soft deletes ("deletedAt") for clinical and financial data. Never hard-delete patient records, invoices, or stock movements.

## Security & Privacy

This is medical data. Treat it as sensitive by default.

- Enforce permissions server-side; deny by default.
- Log access to and changes of patient records ("AuditLog").
- Never log PHI (names, diagnoses) to console or error trackers.
- Validate all input with Zod on the server.
- Secrets in environment variables only; never commit ".env".

## Code Conventions

- TypeScript strict mode. No "any" without a comment explaining why. (Global codebase is currently 0 ESLint errors.)
- Feature-based folders: "src/features/<module>/{actions,components,schemas,queries}".
- Server actions or route handlers do: authenticate -> authorize -> validate -> act -> audit.
- Small, focused commits.

## Commands

`ash
npm install           # install deps
npm run dev           # run dev server
npx prisma db push    # sync Prisma schema
npx prisma db seed    # seed roles, permissions, demo data
npm run test          # unit tests
npm run lint          # strict lint suite
`

## Working Agreements for Claude

- **Ask before assuming** on anything money-related, permission-related, or clinical-data-related.
- When adding a feature, add the permission for it first, then the code.
- If something here conflicts with what the code does, say so and ask; don't silently pick one.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
