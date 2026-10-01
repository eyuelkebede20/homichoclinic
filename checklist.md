# Comprehensive System Test Checklist

Use this checklist to verify that all recent features, workflows, and role-based permissions are functioning correctly in your environment.

## 1. Catalog & Pricing Approvals
- [ ] **Login as Pharmacy or Lab Technician.**
- [ ] Navigate to **Catalogs**.
- [ ] Attempt to **Add** a new drug/test, **Edit** a price, or **Remove** an item.
- [ ] Verify you receive an *"Approval request submitted"* popup instead of the change happening immediately.
- [ ] **Login as Manager or Admin.**
- [ ] Navigate to **Catalogs** and click the yellow **Review Approvals** button.
- [ ] Verify you can see the exact changes proposed by the technician.
- [ ] Click the green checkmark to **Approve** (verify the item is updated in the database) or the red X to **Reject**.

## 2. Staff CSV Import & Dependents (Manager/Admin Only)
- [ ] **Login as Manager or Admin.**
- [ ] Navigate to **Patients** and click **Import CSV**.
- [ ] Download the Sample CSV to ensure the template formatting is correct (`FullName`, `EmployeeID`, `HiredYearEC`, `PrimaryPhone`).
- [ ] Create a test CSV with a mix of Staff (with EmployeeID) and Dependents (no EmployeeID, but matching Phone).
- [ ] Upload the CSV and confirm the success message.
- [ ] **Verify Patient Profiles:**
  - [ ] Staff members should have their discount automatically calculated based on the EC Hired Year (e.g., 20+ yrs = 100%, 0-5 yrs = 50%).
  - [ ] Dependents should be automatically linked to the staff member and have a 95% discount.

## 3. Patient Types & Demographics Locking
- [ ] **Login as Receptionist.**
- [ ] Click **+ New Patient**.
- [ ] Change "Patient Type" to **Soldier** and verify that *Military ID*, *Rank*, and *Division* fields appear.
- [ ] Submit a new patient.
- [ ] Navigate to that Patient's profile (`/patients/[id]`).
- [ ] **Verify Lock:** As a Receptionist, ensure the "Edit Details" button is **hidden**.
- [ ] **Login as Admin:** Navigate to the same profile and verify the "Edit Details" button is **visible** and works.

## 4. Role-Based Dashboards
- [ ] **Login as Receptionist** -> Verify you are instantly redirected to the `/patients` directory.
- [ ] **Login as Doctor** -> Verify you see the Doctor Dashboard displaying:
  - [ ] "My Appointments This Week"
  - [ ] "Patients Awaiting Review"
- [ ] **Login as Pharmacy** -> Verify you see the Inventory Dashboard:
  - [ ] Stock items under 500 units should appear.
  - [ ] Colors should map correctly (Yellow for <500, Orange for <300, Red for <100).
- [ ] **Login as Laboratory** -> Verify you see the Hardware Dashboard:
  - [ ] Total Registered Equipment, Active, and Offline counts.
- [ ] **Login as Admin/Manager** -> Verify you see the General Overview (Revenue, Today's Visits).

## 5. Doctor OPD Auto-Assignment
- [ ] **Login as Doctor.**
- [ ] Look at the Top Navigation Bar and select an active OPD Room (e.g., "Room 3").
- [ ] **Login as Receptionist.**
- [ ] Create a new visit and assign it to that Doctor.
- [ ] Verify that the system automatically tags the visit to "Room 3" so the patient knows where to go.

## 6. Doctor Ordering UX (Chip Cards)
- [ ] As a Doctor, open a patient visit.
- [ ] Under the **Lab Requests** section, verify that tests are displayed as clickable, reusable "Chip Cards" rather than a standard dropdown or basic checkbox grid.

## 7. Global Printing Layouts
- [ ] On any screen with a **Print** button (e.g., Patients Directory, Dashboards, Catalogs), click the button.
- [ ] Verify that the web-browser print dialog opens.
- [ ] Verify the layout is clean:
  - [ ] A unified Clinic Header is applied at the top.
  - [ ] Sidebars, navigation buttons, and interactive icons are hidden from the paper.

## 8. Notification Pings & Auto-Hiding
- [ ] As a Doctor, request a Lab Test or Prescription.
- [ ] **Login as Lab/Pharmacy.**
- [ ] Verify a pulsing notification ping appears on the new requests.
- [ ] Check older pending requests (if any exist in the database > 7 days old) and verify they are automatically hidden from the active queue to prevent clutter.
