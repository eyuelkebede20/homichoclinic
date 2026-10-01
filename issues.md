# Current Product Issues & Missing Features Log

After reviewing the current state of the application architecture, codebase, and your previous markdown instructions, here is a breakdown of problematic areas and missing features that need to be addressed before a full production launch.

## 1. Fixed: Dynamic Discount Cron Job
*   **The Problem:** In `newpatient.md`, you mentioned "and one cronjob can change the data". Currently, the Staff CSV importer calculates the EC Year discount (e.g., 50% for 0-5 years, 55% for 6-9 years) *at the time of import*. If a staff member crosses their 6-year anniversary next month, their discount will remain stuck at 50% unless an Admin manually updates them.
*   **The Fix:** **(Resolved)** The discount calculation has been made dynamic upon patient creation based on `hiredYearEC`. A yearly background cron job endpoint (`/api/cron/yearly-discount`) has been implemented to recalculate and update discounts for all `Civilian Staff` automatically.

## 2. Fixed: Patient Directory Pagination for Low-Power Machines
*   **The Problem:** You previously noted the clinic runs on very old hardware (Dell Optiplex 320s). Right now, the `/patients` directory fetches and renders all patients. If you import 5,000+ staff members and their families via the CSV, rendering 10,000 rows at once in React will cause a massive lag spike and crash the browser on an Optiplex.
*   **The Fix:** **(Resolved)** We have implemented strict server-side pagination (20 patients per page) on the patient directory, and replaced the in-memory static dropdowns in the scheduling and billing screens with a dedicated `/api/patients/search` API for async combobox searching.


## 4. Fixed: The "Cashier" Workflow
*   **The Problem:** The app manages Doctors, Lab Techs, and Pharmacy Techs. However, the final loop of the visit—billing and payments—is disjointed. We have a robust discount calculation system, but we haven't mapped out exactly who processes the final payment invoice. Does Reception handle Cashier duties? 
*   **The Fix:** **(Resolved)** The Cashier role and permissions are fully implemented. The `/billing` dashboard now acts as a central "money trail" hub featuring an "Unbilled Patient Activity" queue. This queue aggregates unbilled visits, lab requests, and prescriptions in real-time, allowing Cashiers to auto-generate aggregated invoices with a single click.

## 5. Fixed: React Hydration Script Error
*   **The Problem:** Next.js threw a console error: `Encountered a script tag while rendering React component`. This was caused by the auto-print `<script>` injected into the Pharmacy Receipt page.
*   **The Fix:** **(Resolved)** I completely removed the raw script tag and replaced it with a React-safe `<AutoPrint />` Client Component that handles `window.print()` using standard `useEffect` lifecycles without breaking hydration.

## 6. Problematic: React 19 `next-themes` Script Injection Error
*   **The Problem:** You are seeing `Encountered a script tag while rendering React component... src/components/theme-provider.tsx (10:10) @ ThemeProvider` in the console. 
*   **Context:** The popular `next-themes` library forces a raw `<script>` tag into the DOM during Server Side Rendering to prevent the screen from "flashing white" before dark mode loads. However, React 19 (which is inside Next 15/16) aggressively blocks standard `<script>` tags inside components. 
*   **The Fix:** This is a cosmetic console warning on development mode and won't crash your app. However, if you want to cleanly resolve it, we can either:
    1. Wait for `next-themes` to release an official React 19 patch.
    2. Rip out `next-themes` entirely and handle dark mode toggling with a custom raw CSS variables implementation.

---
**Next Steps:**
Let me know which of these issues you want to tackle first! I highly recommend addressing the Dynamic Discount Cron Job (#1) next.
