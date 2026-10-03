# Clinic ERP Tasks

Based on workflow.md, here are the remaining tasks to implement, prioritized for simplicity and clarity:

## Phase 1: Nurse & Doctor Workflow (Current Priority)
- [ ] **Nurse Role & Dashboard**: Create a simple queue for Nurses to record vitals (weight, BP, temp) for active visits.
- [ ] **Doctor Consultation View**: Build a unified patient view for Doctors showing history, vitals, and previous labs.
- [ ] **Doctor Actions**: Implement diagnosis entry, lab ordering, and prescription/referral writing.
- [ ] **OPD Routing Toggles**: Add on/off toggles for each OPD room in the Reception Dashboard so patients aren't routed to absent doctors.

## Phase 2: Lab & Pharmacy
- [ ] **Lab Technician Dashboard**: Create a queue for pending lab requests.
- [ ] **Lab Result Entry**: Allow technicians to enter partial results per test (updating the Doctor's queue automatically).
- [ ] **Pharmacy Dashboard**: Queue for pending prescriptions (PENDING -> DISPENSED).
- [ ] **Inventory Deduction**: Deduct stock based on FEFO (First Expired, First Out) when dispensing.

## Phase 3: Cashier & Billing
- [ ] **Cashier Dashboard**: Queue of completed visits to process credit charges.
- [ ] **Discount Application**: Automatically apply the patient's strict discountPercent to the charge.
- [ ] **Finance Rollup**: Tie dependents' charges to the primary staff member's employeeId.

## Phase 4: Maintenance & Edge Cases
- [ ] **Daily Queue Expiry**: Implement an endpoint/cron to mark unfinished visits as EXPIRED at night.
- [ ] **Cancel Visit**: Allow Reception to cancel a visit (mark CANCELLED).