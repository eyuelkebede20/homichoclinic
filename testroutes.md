# E2E Workflow Testing Checklist

This document outlines the End-to-End (E2E) hospital workflow to test. Check these off as you verify each step in the application.

## 1. Setup & Data Preparation
- [ ] Create or verify existence of a Patient in the system.
- [ ] Create or verify existence of a Doctor user.
- [ ] Ensure at least one Drug exists with available stock in the Pharmacy.
- [ ] Ensure at least one Lab Test is defined in the system with a set price.

## 2. Reception
- [ ] **Check-in**: Register a new visit for the Patient and assign them to the Doctor.
- [ ] Verify the visit status is set to `scheduled`.

## 3. Nurse / Triage
- [ ] Find the scheduled visit.
- [ ] **Update Vitals**: Record the patient's weight, blood pressure, and temperature.

## 4. Doctor Consultation
- [ ] Start the consultation (visit status should change to `in_progress`).
- [ ] **Lab Request**: Request a Lab Test for the patient.
- [ ] **Prescription**: Prescribe a drug to the patient (specify quantity and instructions).

## 5. Laboratory
- [ ] View pending lab requests.
- [ ] **Enter Results**: Input findings for the requested lab test and mark it as `completed`.

## 6. Pharmacy
- [ ] View pending prescriptions for the patient.
- [ ] **Dispense Drugs**: Fulfill the prescription.
- [ ] Verify that the drug's stock batch quantity decreases correctly.

## 7. Cashier / Billing
- [ ] Locate the completed visit/patient.
- [ ] **Generate Invoice**: Create the final invoice.
- [ ] Verify the total cost correctly includes the lab test price and the drug price (applying any patient discounts if applicable).
- [ ] Mark the invoice as paid (if applicable) and the visit as `completed`.
