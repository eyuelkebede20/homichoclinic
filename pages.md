# Clinic System Pages

This document outlines all the Next.js pages available in the application and their corresponding roles in the workflow.

## Public / Root
- **`/`** (`src/app/page.tsx`): Landing/index page.

## Authentication
- **`/login`** (`src/app/(auth)/login/page.tsx`): User login.
- **`/register`** (`src/app/(auth)/register/page.tsx`): User registration.

## Dashboard / Main Application
Wrapped by `src/app/(dashboard)/layout.tsx`.

### General
- **`/dashboard`** (`src/app/(dashboard)/dashboard/page.tsx`): Main entry point post-login. Overview for the logged-in user.

### Patients & Reception
- **`/patients`** (`src/app/(dashboard)/patients/page.tsx`): Directory of all patients. Searchable list.
- **`/patients/new`** (`src/app/(dashboard)/patients/new/page.tsx`): Register a new patient.
- **`/patients/import`** (`src/app/(dashboard)/patients/import/page.tsx`): Import patients via CSV (handles staff/dependents).
- **`/patients/[id]`** (`src/app/(dashboard)/patients/[id]/page.tsx`): Patient detail view (history, visits, labs).
- **`/patients/[id]/edit`** (`src/app/(dashboard)/patients/[id]/edit/page.tsx`): Edit patient details.

### Visits & Doctor Queue
- **`/visits`** (`src/app/(dashboard)/visits/page.tsx`): The active queue of visits for today. Used by Doctors (to see their OPD queue) and Reception (to manage check-ins).

### Laboratory
- **`/laboratory`** (`src/app/(dashboard)/laboratory/page.tsx`): Lab queue. Technicians enter test results here.
- **`/laboratory/catalog`** (`src/app/(dashboard)/laboratory/catalog/page.tsx`): Manage available lab tests.

### Pharmacy
- **`/pharmacy`** (`src/app/(dashboard)/pharmacy/page.tsx`): Pharmacy queue. Dispense medications and deduct stock.
- **`/pharmacy/catalog`** (`src/app/(dashboard)/pharmacy/catalog/page.tsx`): Manage available drugs and inventory batches.
- **`/pharmacy/receipt/[prescriptionId]`** (`src/app/(dashboard)/pharmacy/receipt/[prescriptionId]/page.tsx`): Printable receipt or ledger for a dispensed prescription.

### Billing & Finance
- **`/billing`** (`src/app/(dashboard)/billing/page.tsx`): Manage credit charges.
- **`/billing/new`** (`src/app/(dashboard)/billing/new/page.tsx`): Create a new charge.
- **`/billing/[id]`** (`src/app/(dashboard)/billing/[id]/page.tsx`): View a specific charge.
- **`/billing/reports`** (`src/app/(dashboard)/billing/reports/page.tsx`): Monthly finance export generation.
- **`/billing/reports/expandable`** (`src/app/(dashboard)/billing/reports/expandable/page.tsx`): Detailed drill-down for finance reports.

### Admin & Auditing
- **`/admin`** (`src/app/(dashboard)/admin/page.tsx`): User role and privilege management.
- **`/audit`** (`src/app/(dashboard)/audit/page.tsx`): System audit logs (e.g., changes to diagnosis, discount updates).
- **`/catalogs/approvals`** (`src/app/(dashboard)/catalogs/approvals/page.tsx`): Manage approvals for catalog changes.
