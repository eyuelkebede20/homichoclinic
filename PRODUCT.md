# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Receptionists**: Search, register, and check-in patients.
- **Nurses**: Record vitals.
- **Doctors**: View queues, write diagnoses, order labs, prescribe medications, and update histories.
- **Lab Technicians**: Enter test results.
- **Pharmacists**: Dispense medication and manage stock.
- **Cashiers / Finance**: Manage credit charges and salary deductions for staff patients.
- **Managers / Admins**: Handle reporting and user control.

## Product Purpose
A clinic management system that tracks the end-to-end patient journey from check-in to pharmacy/billing, specifically designed for staff and their dependents. It manages visits, lab queues, prescriptions, inventory, and credit-based billing.

## Positioning
An internal company clinic system where patients are staff members (or dependents) whose medical bills are automatically charged to credit and deducted from their salaries.

## Operating Context
- Patients must be checked into specific OPDs.
- Lab results arrive incrementally per test.
- Pharmacy requires manual paper ledger signatures but stock is tracked digitally (FEFO).
- Billing operates entirely on credit (no cash at the desk), with monthly exports to Finance for salary deduction.
- The queue resets/expires at night.

## Capabilities and Constraints
- **Timezone**: Africa/Addis_Ababa (must be strictly adhered to, no UTC for visit dates).
- **Data Import**: Staff imported via CSV (watch out for BOM and `employeeId` mapping).
- **Discount Rules**: System applies discounts automatically based on tenure (`permanentSince`). Nobody can manually change discounts after registration.
- **Hardware/Output**: Requires print layouts for prescriptions, referrals, lab results, and finance exports.
- **Money**: Stored in integer minor units, no floats.

## Evidence on Hand
- Detailed workflow documentation (`workflow.md`) and Next.js / Tailwind stack setup.
