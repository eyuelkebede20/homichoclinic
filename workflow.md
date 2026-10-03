# workflow.md

Operational workflow for the clinic system. Read this together with `CLAUDE.md` before building any visit, billing, lab, or pharmacy feature. When the two disagree, **this file wins on process, and `CLAUDE.md` wins on tech and conventions**.

> Status: draft based on the owner's answers. Items marked **[OPEN]** are not decided yet; do not guess, ask.

---

## 1. Actors

| Role | Responsibility in the flow |
|---|---|
| Reception | Finds/registers patient, checks them in to an OPD, cancels no-shows, toggles OPD availability |
| Nurse | Records vitals before the doctor sees the patient |
| Doctor | Sees patient, orders labs/tests, writes diagnosis, issues prescription or referral, updates patient history |
| Laboratory / Testing | Receives requests, enters results per test |
| Pharmacy | Hands out medication, records dispensing, stock deducts |
| Cashier | Creates the credit charge for the visit, applying the patient's discount |
| Finance | Receives charges and deducts them from staff salary |
| Manager / Admin | Reports, user and privilege control (see `CLAUDE.md`) |

---

## 2. End-to-end flow

```
Reception -> (Nurse: vitals) -> Doctor -> [Lab/Testing] -> Diagnosis -> Prescription or Referral -> OPD cycle DONE
                                                                                   |
                                                                                   +--> Pharmacy (separate track)
Cashier creates the credit charge -> Finance deducts from salary
```

### Step 1: Reception check-in
1. Reception's dashboard shows the list of OPDs with a **search bar on top**.
2. Search by **patient name or phone number**. Results must show enough to tell people apart: full name, date of birth, relationship (staff/dependent), employee ID. Family members share phone numbers and staff IDs.
3. If the patient is not found, register them from the same screen, then check them in.
4. Check-in assigns the patient to an **OPD (doctor)**. This creates one `Visit` for today.
5. Reception **cannot assign** a patient to an OPD that is toggled **off** (see 4.2).
6. Use the word **"check-in"** in code and UI, not "admit" (admit implies inpatient).

### Step 2: Nurse (vitals)
- Nurse records weight, blood pressure, temperature, etc. on the visit before the doctor sees it.
- **[OPEN]** Is the nurse step mandatory before the doctor, or optional? Default: optional (doctor can proceed without vitals).

### Step 3: Doctor
- The doctor's dashboard is a **searchable list of today's patients** for their OPD only.
- Opening a patient shows history, vitals, previous visits, and labs.
- The doctor can:
  - order lab/diagnostic tests (zero or more),
  - write the diagnosis,
  - finish with a **prescription** or a **referral**,
  - **update the patient history** at any time.
- A visit **may be finished without any lab work**.
- Lab results can be **partial** (per test). The visit does not wait for all of them.

### Step 4: Lab / Testing
- Requests appear in the lab queue linked to the visit.
- Results are entered **per test**. When a result is saved, the doctor's list updates (poll every 10-15 s; no websockets needed).
- A result that is saved flags the visit as "results ready" for the doctor.

### Step 5: Finish (OPD cycle done)
- The doctor finishes by writing the diagnosis plus a prescription **or** a referral.
- The visit becomes **COMPLETED**, shown visually muted as **"Done"** and sorted below active patients.
- "Done" means the **OPD cycle** is finished. It does not mean the patient has collected medication.

### Step 6: Pharmacy (separate track)
- Patients with a prescription go to the pharmacy.
- Pharmacy staff hand over the medication. The patient **signs manually on a paper ledger**.
- The system still records the dispensing (who dispensed, what, which batch, when) and **deducts stock** (FEFO by batch expiry), so inventory matches reality.
- Prescription status is tracked separately: `PENDING -> DISPENSED`.

### Step 7: Billing (credit, no cash at the desk)
- Patients are staff (and their dependents). Nothing is paid at the cashier. Charges go on **credit** and **Finance deducts them from the staff member's salary**.
- The cashier creates the charge for the visit and the system applies the patient's **discount %** (see section 5).
- Each charge is tied to the **primary staff member's `employeeId`** so Finance can deduct correctly. Dependents' charges roll up to the staff member they belong to (`primaryPatientId`).
- Charge statuses: `OPEN -> SENT_TO_FINANCE` (optionally `DEDUCTED` if Finance confirms).
- Finance gets a **monthly export** grouped by `employeeId`.

---

## 3. Visit lifecycle

One `Visit` row per patient per OPD per day. This table is the doctor's queue and the backbone of the flow.

```
WAITING -> WITH_DOCTOR -> COMPLETED
   |                         
   +-> CANCELLED   (reception hits the x button)
   +-> EXPIRED     (still unfinished when the day ends)
```

- **Lab status is not a visit status.** Lab requests carry their own status (`REQUESTED -> IN_PROGRESS -> RESULT_READY`). The visit only shows an indicator ("results ready") derived from them.
- **Pharmacy and billing statuses are separate** from the visit status, on the prescription and the charge.
- `visitDate` is computed in the **clinic's timezone (Africa/Addis_Ababa)**, never UTC, so late-evening visits land on the right day.
- Every visit stores `visitDate`, `admittedAt`, `completedAt`, and `queueNumber` (per doctor per day).
- Sort and filter by `visitDate`. The doctor's dashboard defaults to **today** and has a date picker for earlier days.

### Daily expiry
- The queue **expires at night**. A scheduled job marks every unfinished visit from the day as `EXPIRED`. Nothing carries over automatically.
- Expired and cancelled visits remain in the database for history and reporting; they just don't show in the active queue.
- This is separate from the discount cron (section 5), which is deferred.

---

## 4. Exceptions and rules

### 4.1 No-shows and cancellation
- Reception can remove a patient from the queue with the **x** button, which sets `CANCELLED`.
- Anything left over at night becomes `EXPIRED` automatically.

### 4.2 Doctor absent
- Reception has an **on/off toggle per OPD**.
- When an OPD is **off**, check-in cannot assign patients to it. Existing waiting visits for that OPD are shown to reception so they can be moved or cancelled.
- **[OPEN]** Can reception move a waiting patient to another OPD? Default: yes.

### 4.3 Corrections
- A doctor may edit a diagnosis after finishing, and add to the patient history.
- Edits are **audited** (who, when, old value, new value). Never overwrite silently.

### 4.4 Emergencies
- **[OPEN]** Priority/emergency patients who skip the queue. Not designed yet.

---

## 5. Discount rules

> **Conflict to resolve before building. See `CLAUDE.md` > Core Feature: Patient Discount.**

What the owner has said so far:
- **Nobody can change the discount manually.** (This replaces the earlier idea that the Manager adjusts it with a slider.)
- **Reception can set it only** when registering a **new patient**, or when an **imported** patient has **no `permanentSince`** value.
- After that, **the system updates it automatically** (the cron, which is **deferred**; the owner will describe it in `cron.md`).
- The discount appears to depend on tenure via `permanentSince`. **[OPEN]** confirm the exact formula/tiers.
- **[OPEN]** Does the Manager keep an emergency override? Default until answered: **no one can edit it** once set.

Implementation rules (these still hold):
- `Patient.discountPercent` is an integer `0-99`, default `0`.
- Money is stored in **integer minor units**. No floats.
- The discount is applied **server-side** and **snapshotted** onto the charge (`discountPercentApplied`) so later changes never rewrite past charges.
- Every change to the discount (including by the future cron, as actor `system`) writes an audit record.
- All writes go through one function, `setPatientDiscount(patientId, percent, actor)`.

---

## 6. Data import (CSV)

- Staff are imported from a CSV file. **`employeeId` currently is not being imported even though the column exists in the file.** Likely causes to check, in order:
  1. Header mismatch (`Employee ID` vs `employeeId` vs `employee_id`), or case differences.
  2. A hidden **BOM** character glued to the first header.
  3. Leading/trailing spaces in headers or values.
  4. The import mapping never reads that column.
- Normalize headers on import (trim, lowercase, strip BOM) and map them explicitly. Log the parsed header row when debugging.
- `employeeId` is **not unique per patient**: staff and their dependents can share it. Do not mark it `@unique` on `Patient`. Use `@@index([employeeId])` and a looser rule like unique on (`employeeId`, `relationship`, `firstName`, `lastName`).
- The "does this patient already exist?" check must use the same fields the database uses to decide uniqueness.
- Store missing values as `null`, never `""` or `"-"`.
- Imported patients with no `permanentSince` are flagged so reception can fill it in (see section 5).

---

## 7. Printing

Plan for print layouts (A4 or half-page) for: prescription, referral letter, lab result sheet, and the monthly Finance export. Paper is still part of this clinic's life.

---

## 8. Build order

1. **MVP:** auth and roles, patient search/register/check-in, OPD toggle, doctor queue, nurse vitals, diagnosis, prescription/referral, visit lifecycle, daily expiry.
2. **Next:** lab/testing flow, pharmacy dispensing with stock deduction, credit charge and Finance export.
3. **Later:** referral letters and print templates, paper-record digitization, discount cron (`cron.md`).

---

## 9. Metrics to track

Average time from check-in to doctor; average lab turnaround; patients per doctor per day; total discount given as a share of charges; unfinished (expired) visits per day.

---

## 10. Open questions (summary)

1. Exact discount formula based on `permanentSince`, and whether Manager can override.
2. Is the nurse step mandatory?
3. Can reception move a waiting patient to another OPD?
4. Emergency / priority queue behavior.
5. Does Finance confirm deductions back into the system, or is the export one-way?
6. Which charge items exist (consultation, labs, tests, drugs) and what are their prices?
7. Single clinic or multi-branch?
