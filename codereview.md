# Full Code Review - Bure Clinic App

This document outlines the findings of a comprehensive code review of the `Bure_Card` clinic management repository, covering architecture, security, database design, business logic, and maintainability.

## 1. Architecture & General Best Practices

### **Strengths:**
- **Feature-Driven Architecture:** The codebase is well-organized using a domain-driven feature folder structure (`src/features/admin`, `src/features/billing`, etc.). This makes the codebase highly maintainable and scalable.
- **Server Actions via `createSafeAction`:** Wrapping all Next.js Server Actions with a custom `createSafeAction` utility (using Zod validation and permission checks) is an excellent pattern. It guarantees that inputs are always validated and that the executing user has the correct Role-Based Access Control (RBAC) permission before hitting business logic.
- **Clear Next.js App Router Usage:** The separation of Server Components for data fetching and Server Actions for mutations aligns perfectly with Next.js 14+ best practices.

### **Areas for Improvement:**
- **Code Duplication (DRY Violation):** The `dispensePrescription` function is duplicated identically in both `src/features/clinical/actions.ts` (line 409) and `src/features/pharmacy/actions.ts` (line 51). While the logic (FEFO stock deduction via Prisma transaction) is excellent, maintaining two copies is dangerous. **Action:** Remove the duplicate from `clinical/actions.ts` and use a single shared service or import from `pharmacy`.
- **Hardcoded Role Checks:** In `src/features/patients/actions.ts` (inside `updatePatient`), there is a hardcoded role check: `if (ctx.role !== "Admin")` and `if (ctx.role === "Receptionist")`. This breaks the RBAC permission model enforced by `createSafeAction`. **Action:** Use explicit permissions (e.g., `PERMISSIONS.PATIENT_UPDATE_ALL`) rather than hardcoding role names.

---

## 2. Database & Prisma Optimization

### **Strengths:**
- **Comprehensive Schema:** The schema accurately represents the complex clinic domain (Visits, Patients, Inventory, Lab, Billing, Audit Logs).
- **Strong Transaction Usage:** Complex operations like `dispensePrescription`, `recordPayment`, and `generateCreditCharge` correctly utilize `prisma.$transaction`. This prevents partial updates and guarantees data consistency (e.g., deducting stock while marking a prescription as dispensed).

### **Critical Areas for Improvement:**
- **Missing Database Indexes (`@@index`):** The `prisma/schema.prisma` file is almost entirely devoid of indexes. Because this is a PostgreSQL database, foreign keys are *not* automatically indexed. Without indexes, queries fetching patient histories will result in slow full-table scans, crippling performance as the clinic's data grows.
  - **Action:** Add `@@index([patientId])` to `Visit`, `MedicalRecord`, `LabRequest`, `Prescription`, and `Invoice`.
  - **Action:** Add `@@index([invoiceId])` to `InvoiceItem`, `Payment`, `LabRequest`, and `PrescriptionItem`.
  - **Action:** Add `@@index([contactNumber])` and `@@index([militaryId])` to `Patient` to speed up the duplicate checks in `createPatient`.
- **Soft Delete Handling Risk:** The schema defines `deletedAt DateTime?` for soft deletes on models like `Patient` and `Visit`. However, the server actions (e.g., `searchPatientsFast` or `findUnique` queries) do not explicitly filter out `deletedAt: { not: null }`. 
  - **Action:** If you are not using a Prisma Client extension (Middleware) to automatically filter out soft-deleted records, you must update every `.findMany` and `.findUnique` query to ignore records where `deletedAt` is not null. Otherwise, deleted patients will still appear in the UI.

---

## 3. Security & Auditing

### **Strengths:**
- **Robust Audit Logging:** The `logAudit` function is called at the end of every mutating Server Action, providing a secure, tamper-evident trail of who did what. This is vital for healthcare compliance.
- **Secure Password Handling:** The `admin/actions.ts` correctly hashes manual password resets using `bcryptjs` with a salt round of 10.
- **Permission Enforcement:** Actions correctly define `requiredPermission: PERMISSIONS.*` out of the gate.

### **Areas for Improvement:**
- **Race Conditions in Billing:** In `clinical/actions.ts` (`generateCreditCharge`), the action fetches `labRequests` and `prescriptions` that have `invoiceId: null`, creates an invoice, and updates them. While wrapped in a transaction, high concurrency (e.g., two receptionists clicking "Generate Bill" simultaneously for the same patient) could result in double billing if rows aren't locked (`SELECT ... FOR UPDATE`).
  - **Action:** While Prisma lacks direct `FOR UPDATE` support without `$queryRaw`, ensuring strict UI-level debouncing and relying on the transaction might suffice for a local clinic, but be aware of the race condition risk.

---

## 4. Specific Business Logic Notes

- **Smart Load Balancing:** The OPD assignment logic inside `createVisit` (`clinical/actions.ts`) is highly sophisticated. It fetches active rooms, groups current visits, and dynamically assigns the incoming patient to the room with the fewest waiting patients. This is an excellent implementation of queue theory for the clinic.
- **FEFO (First Expiry, First Out) Inventory:** The stock deduction logic correctly sorts `StockBatch` by `expiryDate: "asc"` before deducting quantities. This ensures older drugs are dispensed first, minimizing waste. Excellent work.
- **Ethiopian Calendar Logic:** Noted the integration of `getECYearsOfService` for discount calculations in `patients/actions.ts`. The military ID string parsing fallback is a clever safety net.

---

## Actionable Recommendations (Next Steps)

1. **Update `prisma/schema.prisma`** to add `@@index` blocks on all foreign keys and frequently searched text fields. Run `npx prisma db push` (or `migrate dev`) after.
2. **Refactor `dispensePrescription`**: Remove the duplicate implementation in `clinical/actions.ts`.
3. **Verify Soft Deletes**: Ensure a Prisma Client extension is globally ignoring records where `deletedAt != null`, or manually add the `deletedAt: null` clause to your `.findMany` queries.
4. **Refactor Hardcoded Roles**: Replace string-based role checks in `updatePatient` with specific granular permissions.
