# Project Tasks & Progress Tracker

This document tracks all tasks, reviews the two recently closed paired-programming agent conversations, details where each conversation was when it was shut down, and records the resolution of all in-flight and begun tasks.

---

## 1. Executive Summary of Closed Conversations

| Conversation ID | Focus Areas | Final State When Shut Down | Resolution in this Session |
|---|---|---|---|
| **Convo 1** (`1bce8b35-...`) | Clinical features: `issues.md`, family discounts & linking, fast search, Z-reports cashier attribution, structured lab results, selective sub-test ordering (CBC, Stool, Urine). | **Begun / In-flight**: The user requested that laboratory result inputting only require selected sub-tests and that multi-test orders be sent and handled as one combined request instead of fragmented requests. Convo 1 finished the backend schema and CBC form, but was interrupted before completing `StoolResultForm`, `UrineResultForm`, and the lab queue request consolidation. | **Finished Completely**: Upgraded `StoolResultForm` and `UrineResultForm` with selective requirement indicators, optional tags, "Fill Requested Normal" buttons, and non-blocking validation. Added `groupPendingLabRequests` and consolidated panel requests across both `/dashboard` and `/laboratory` with `linkedRequestIds` handling. |
| **Convo 2** (`3e57df3e-...`) | Infrastructure & Referrals: Linux `.sh` daemon watcher scripts, `start.sh` git stash protection, admin updater debugging, referral sheet dynamic clinic profile & 1-page print fit. | **Dangling TypeScript Error**: Convo 2 updated `mds/refere.md`, `referral-button.tsx`, and `doctor-orders.tsx` for dynamic clinic profile header and single-page A4 printing. It was shut down right while dispatching the final edit in `src/app/(dashboard)/patients/[id]/page.tsx`, leaving a broken reference to `clinicSubName` on line 335. | **Finished Completely**: Cleaned up the leftover `clinicSubName` in `patients/[id]/page.tsx`. Verified full TypeScript check (`tsc --noEmit`) passes with zero errors. |

---

## 2. Conversation 1 Review (`1bce8b35-752b-433d-b7ee-e5de998c8217`)

### User Prompts in Conversation 1
1. *"can you please fix the following issues in issues.md"*
2. *"on search the patient family needs to input a phone number and a previous card number since the search wouldn't work fo rthem unless they do"*
3. *"can you please fix the following issues in issues.md and review the current chat history and what claude was working on just now"*
4. *"do the same on Urine and stool that way they can order the full orrr just the selected few"*
5. *"fix the result inputing for the labratory aswell ... have the form but only require the selected ones and pleae have them sent as one becaues for some reason they are seen as different requests"*

### Tasks Breakdown & Detailed Status

#### Task 1.1: Civilian Family Member Discount (Fixed at 95%) & Family Linking
- **Source**: `issues.md` (Issue 1)
- **Status**: `Completed`
- **Implementation**:
  - In [`createPatient`](file:///D:/Apps/2019/Bure_Card/src/features/patients/actions.ts) and [`updatePatient`](file:///D:/Apps/2019/Bure_Card/src/features/patients/actions.ts), civilian family discount is locked to **95%** (`getDiscount("discount:Civilian Family", 95)`).
  - Search tokens allow matching primary patient's phone number, card number/ID, military ID, and employee ID.
  - Linking preserves the relationship and discount rules.

#### Task 1.2: Soldier Family Member Discount (100%) & Family Tree Linking
- **Source**: `issues.md` (Issue 2)
- **Status**: `Completed`
- **Implementation**:
  - Soldier family discount locked to **100%** (`getDiscount("discount:Soldier Family", 100)`).
  - Linked primary patient record details (military ID, contact number, name) display in patient header, search results, and family tree.

#### Task 1.3: Reception Fast Patient Search Enhancement
- **Source**: User follow-up in Convo 1
- **Status**: `Completed`
- **Implementation**:
  - In [`src/features/patients/actions.ts`](file:///D:/Apps/2019/Bure_Card/src/features/patients/actions.ts) (`searchPatientsFast`), tokens now match both the patient's own fields and linked primary patient fields (`primaryPatient.contactNumber`, `primaryPatient.employeeId`, `primaryPatient.militaryId`).
  - [`reception-patient-search.tsx`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/reception-patient-search.tsx) displays primary patient badge and contact information directly in search dropdown results.

#### Task 1.4: Data Encoder Z-Reports Transaction Attribution to Staff
- **Source**: `issues.md` (Issue 3)
- **Status**: `Completed`
- **Implementation**:
  - Added `billedBy` tracking in [`src/features/dataencoder/actions.ts`](file:///D:/Apps/2019/Bure_Card/src/features/dataencoder/actions.ts).
  - Updated [`src/app/(dashboard)/dataencoder/z-reports/page.tsx`](file:///D:/Apps/2019/Bure_Card/src/app/(dashboard)/dataencoder/z-reports/page.tsx) and [`z-reports-client.tsx`](file:///D:/Apps/2019/Bure_Card/src/app/(dashboard)/dataencoder/z-reports/z-reports-client.tsx) to attribute invoices and cash receipts to specific cashiers/staff members with printable breakdown for finance.

#### Task 1.5: Medical History Lab Results Grid Layout
- **Source**: `issues.md` (Issue 7)
- **Status**: `Completed`
- **Implementation**:
  - In [`src/features/clinical/components/structured-lab-result-view.tsx`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/structured-lab-result-view.tsx), all lab results (Hematology, Stool, Urine, and general test findings) render inside comprehensive responsive grid tables with reference ranges, abnormal flags, and structured headers.

#### Task 1.6: Selective Sub-Test Ordering on Doctor Side (Hematology, Stool, Urine)
- **Source**: `issues.md` (Issue 5) & Convo 1 user prompt
- **Status**: `Completed`
- **Implementation**:
  - Core test catalog updated in [`page.tsx`](file:///D:/Apps/2019/Bure_Card/src/app/(dashboard)/patients/[id]/page.tsx) and [`seed-db/route.ts`](file:///D:/Apps/2019/Bure_Card/src/app/api/seed-db/route.ts) with sub-tests for:
    - **Hematology**: WBC + Diff, Hemoglobin & Hematocrit, Platelets, ESR, Coagulation (PT/BT/CT), Morphology, Indices.
    - **Stool**: Stool Routine, Occult Blood (FOBT), Ova & Parasite (Microscopic), Macroscopic.
    - **Urine**: Routine Urinalysis, Dipstick (Albumin & Sugar), Microscopic Sediment, Bile/Urobilinogen, Physical.
  - In [`doctor-orders.tsx`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/doctor-orders.tsx), doctors can pick the full panel OR click individual sub-tests with real-time price calculation and picker modals.

#### Task 1.7 (THE BEGUN ONE): Laboratory Result Inputting & Combined Request Processing
- **Source**: Convo 1 final prompt: *"fix the result inputing for the labratory aswell ... have the form but only require the selected ones and pleae have them sent as one becaues for some reason they are seen as different requests"*
- **Status**: `Completed in this Session` (Was in-progress when Convo 1 shut down)
- **Work Completed**:
  1. **Selective Requirements on All Lab Forms**:
     - [`HematologyResultForm`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/hematology-result-form.tsx): Parses `parseHematologySelectedSubTests`, shows "Selective Order" banner, highlights requested sections with `★ REQUIRED` and border, marks non-requested as `(Optional)`, and provides "Fill Requested Normal" button.
     - [`StoolResultForm`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/stool-result-form.tsx): Added `parseStoolSelectedSubTests`, "Selective Order" banner, highlights Occult Blood (FOBT), Ova & Parasite, and Macroscopic fields with `★ REQUIRED` and green border; removed hardcoded `required` constraint on Ova & Parasite when not requested (`required={selected.reqOvaParasite}`); added "Fill Requested Normal" button.
     - [`UrineResultForm`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/urine-result-form.tsx): Added `parseUrineSelectedSubTests`, "Selective Order" banner, highlights Physical, Chemical (Albumin, Sugar, Ketones, Bile), and Sediment sections with `★ REQUIRED` and amber border; relaxed microscopic required attribute (`required={selected.reqSediment}`); added "Fill Requested Normal" button.
  2. **Multi-Test Orders Sent & Handled as ONE Request**:
     - In [`src/features/clinical/actions.ts`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/actions.ts) (`requestLabTest`): Sub-tests of the same panel (Hematology, Stool, Urine) are combined into a single unified `LabRequest` with combined pricing and descriptive name.
     - In [`src/features/clinical/types/lab-panels.ts`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/types/lab-panels.ts): Created `groupPendingLabRequests<T>()` utility to merge existing/pending requests by `(patientId, panelType)`.
     - In [`src/features/clinical/components/lab-dashboard.tsx`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/lab-dashboard.tsx): Merges pending tests so the lab technician sees ONE unified worklist card with a badge indicating `X orders combined`, opening the form with all requested sub-tests, and completing all linked requests in one transaction via `enterLabResult({ requestId, linkedRequestIds, findings })`.
     - In [`src/app/(dashboard)/laboratory/page.tsx`](file:///D:/Apps/2019/Bure_Card/src/app/(dashboard)/laboratory/page.tsx): Integrated `groupPendingLabRequests` and passed `linkedRequestIds` to [`LabResultForm`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/lab-result-form.tsx), ensuring all linked requests are completed together.

---

## 3. Conversation 2 Review (`3e57df3e-2bdf-49a8-8d61-9e8f1307a575`)

### User Prompts in Conversation 2
1. *"run the pnpm"*
2. *"does the start.sh have a git stash so there won't be a merge issue or a pull issue"*
3. *"why is updating using the udpate system button under admin not working?"*
4. *"we need the .sh file version of the bat and please update the start.sh because we are running the code currently on linux"*
5. *"from refere.md please fix the name that way it only takes the name of the instuttion form clinic profile ... the for insance <div class="am">የመከላከያ ኢንጂነሪንግ ኢንዱስትሪዎች ግሩፕ</div> ... aren't necessary because they can change and please make it fit in a page ... that way the referal sheet doesn't go to another page"*

### Tasks Breakdown & Detailed Status

#### Task 2.1: Local Development Pipeline & Dev Server
- **Status**: `Completed`
- **Implementation**: Executed startup pipeline: Prisma client generation, database schema sync, and dev server start.

#### Task 2.2: Linux `.sh` Deployment Scripts
- **Status**: `Completed`
- **Implementation**:
  - Created Linux bash equivalents for all deployment batch files in `deploy/`:
    - [`deploy/clinic-watcher.sh`](file:///D:/Apps/2019/Bure_Card/deploy/clinic-watcher.sh): Background daemon watching for `deploy/update.signal`.
    - [`deploy/install-watcher.sh`](file:///D:/Apps/2019/Bure_Card/deploy/install-watcher.sh): Systemd service installer (`clinic-watcher.service`).
    - [`deploy/update.sh`](file:///D:/Apps/2019/Bure_Card/deploy/update.sh): Interactive updater script with safe directory configuration and container rebuild.
    - [`deploy/show-url.sh`](file:///D:/Apps/2019/Bure_Card/deploy/show-url.sh): Displays local IP and application access URLs.
    - [`deploy/static-ip.sh`](file:///D:/Apps/2019/Bure_Card/deploy/static-ip.sh): Network manager script for static IP configuration.
  - Updated [`deploy/README.md`](file:///D:/Apps/2019/Bure_Card/deploy/README.md) with Linux deployment instructions.

#### Task 2.3: `start.sh` Git Stash Protection & Self-Update
- **Status**: `Completed`
- **Implementation**:
  - Updated [`start.sh`](file:///D:/Apps/2019/Bure_Card/start.sh) to run `git stash` before `git pull --ff-only` to ensure local changes never cause merge conflicts during startup self-updates.
  - Added automatic executable permission granting (`chmod +x deploy/*.sh *.sh`) and systemd / background watcher check.

#### Task 2.4: Admin "Update System" Pipeline Fix
- **Status**: `Completed`
- **Implementation**:
  - In [`src/features/admin/actions.ts`](file:///D:/Apps/2019/Bure_Card/src/features/admin/actions.ts) (`triggerSystemUpdate`), resets `update.status` when initiating an update so the dashboard shows real-time progress.
  - Watcher scripts monitor `deploy/update.signal` and trigger git pull and docker rebuild.

#### Task 2.5: Referral Sheet Dynamic Clinic Profile & Single A4 Page Fit
- **Status**: `Completed in this Session` (Left dangling compilation error when shut down)
- **Implementation**:
  - Updated [`mds/refere.md`](file:///D:/Apps/2019/Bure_Card/mds/refere.md): Removed hardcoded institutional names ("Defence Engineering Industries Group", "Homicho Ammunition Engineering Industry Health Center"); replaced with dynamic tags `{{clinicNameAmharic}}` and `{{clinicName}}`.
  - Tightened print CSS (`@page { size: A4 portrait; margin: 8mm 10mm; }`, compact line heights, reduced section padding) ensuring referrals fit strictly onto **one single page** without spilling onto a second page.
  - Mirrored single-page template in [`referral-button.tsx`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/referral-button.tsx) and [`doctor-orders.tsx`](file:///D:/Apps/2019/Bure_Card/src/features/clinical/components/doctor-orders.tsx).
  - Fixed TypeScript compiler error in [`patients/[id]/page.tsx`](file:///D:/Apps/2019/Bure_Card/src/app/(dashboard)/patients/[id]/page.tsx#L335) by removing undefined `clinicSubName` references.

---

## 4. Current Tasks Matrix

| # | Task Description | Origin | Component / Path | Status |
|---|---|---|---|:---:|
| 1 | Civilian family discount 95% + search linking | Convo 1 | `src/features/patients/actions.ts` | **DONE** |
| 2 | Soldier family discount 100% + family tree linking | Convo 1 | `src/features/patients/actions.ts` | **DONE** |
| 3 | Reception fast search by phone, card number & primary patient | Convo 1 | `reception-patient-search.tsx` | **DONE** |
| 4 | Z-reports cashier attribution & finance printable summary | Convo 1 | `src/app/(dashboard)/dataencoder/z-reports/` | **DONE** |
| 5 | Medical history all-grid view for lab results | Convo 1 | `structured-lab-result-view.tsx` | **DONE** |
| 6 | Selective ordering for Hematology, Stool, and Urine panels | Convo 1 | `doctor-orders.tsx`, `seed-db/` | **DONE** |
| 7 | **Selective result inputting on Stool & Urine forms (Required highlights, Fill Requested Normal)** | **Convo 1 (Begun)** | `stool-result-form.tsx`, `urine-result-form.tsx` | **DONE** |
| 8 | **Send & handle multi-test panel orders as one combined request** | **Convo 1 (Begun)** | `actions.ts`, `lab-dashboard.tsx`, `laboratory/page.tsx` | **DONE** |
| 9 | Linux `.sh` deployment & background watcher daemon scripts | Convo 2 | `deploy/*.sh`, `start.sh` | **DONE** |
| 10 | `start.sh` git stash protection against pull conflicts | Convo 2 | `start.sh`, `update.sh` | **DONE** |
| 11 | Admin dashboard "Update System" signal file & status reset | Convo 2 | `src/features/admin/actions.ts` | **DONE** |
| 12 | Referral sheet single A4 page fit & dynamic clinic profile header | Convo 2 | `mds/refere.md`, `referral-button.tsx`, `doctor-orders.tsx` | **DONE** |
| 14 | Patient registration & edit form live debounced autocomplete linking | Convo 1 / Polish | `patient-form.tsx`, `patient-edit-form.tsx` | **DONE** |
| 15 | Data Encoder direct navigation link to Z-Reports finance ledger | Polish | `src/app/(dashboard)/dataencoder/page.tsx` | **DONE** |
| 16 | **Family linking filter mechanism by phone number, ID, name & role** | **Current** | `family-link-selector.tsx`, `actions.ts`, `patient-form.tsx`, `patient-edit-form.tsx` | **DONE** |

---

## 5. Verification & Health Check

- **TypeScript Compilation**: `pnpm tsc --noEmit` executed cleanly with **0 errors**.
- **Database Schema**: Schema is consistent and synced.
- **Discounts Verified**:
  - Soldier Family: **100%** discount verified across database patients.
  - Civilian Family: **95%** discount verified across database patients and admin defaults.
  - Linking: Primary patient lookup by phone number, employee ID, military ID, or name verified with live autocomplete dropdown and pill badge selection.
- **Git State**: Clean working tree with zero syntax/type errors.