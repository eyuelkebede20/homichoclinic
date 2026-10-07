// Permissions map defined as resource:action
export const PERMISSIONS = {
  // Patients
  PATIENT_CREATE: 'patient:create',
  PATIENT_READ: 'patient:read',
  PATIENT_UPDATE: 'patient:update',
  
  // Discount
  DISCOUNT_READ: 'discount:read',
  DISCOUNT_UPDATE: 'discount:update',

  // Visits
  VISIT_CREATE: 'visit:create',
  VISIT_READ: 'visit:read',
  VISIT_UPDATE: 'visit:update',

  // Medical History & Records
  HISTORY_READ: 'history:read',
  HISTORY_WRITE: 'history:write',

  // Lab & Testing
  LAB_REQUEST: 'lab:request',
  LAB_READ: 'lab:read',
  LAB_RESULT: 'lab:result',
  
  TEST_REQUEST: 'test:request',
  TEST_READ: 'test:read',
  TEST_RESULT: 'test:result',

  // Pharmacy & Inventory
  PRESCRIPTION_CREATE: 'prescription:create',
  PRESCRIPTION_DISPENSE: 'prescription:dispense',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_ADJUST: 'inventory:adjust',

  // Catalogs
  CATALOG_REQUEST: 'catalog:request',
  CATALOG_APPROVE: 'catalog:approve',

  // Billing
  INVOICE_CREATE: 'invoice:create',
  INVOICE_READ: 'invoice:read',
  PAYMENT_CREATE: 'payment:create',

  // Admin
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  AUDIT_READ: 'audit:read',
} as const;

// Create a union type of all permission strings
export type PermissionString = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Map standard Roles to their default Permission sets
export const ROLE_PERMISSIONS: Record<string, PermissionString[]> = {
  Admin: Object.values(PERMISSIONS),
  Manager: [
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.DISCOUNT_UPDATE,
    PERMISSIONS.DISCOUNT_READ,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.CATALOG_APPROVE,
    PERMISSIONS.CATALOG_REQUEST,
  ],
  Reception: [
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.VISIT_CREATE,
    PERMISSIONS.VISIT_READ,
    PERMISSIONS.VISIT_UPDATE,
  ],
  Dataencoder: [
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.DISCOUNT_READ, // Dataencoders can only read the discount
    PERMISSIONS.PATIENT_READ,
  ],
  Doctor: [
    PERMISSIONS.PATIENT_READ,
    PERMISSIONS.HISTORY_READ,
    PERMISSIONS.HISTORY_WRITE,
    PERMISSIONS.LAB_REQUEST,
    PERMISSIONS.LAB_READ,
    PERMISSIONS.TEST_REQUEST,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.PRESCRIPTION_CREATE,
    PERMISSIONS.VISIT_READ,
    PERMISSIONS.VISIT_UPDATE,
  ],
  Laboratory: [
    PERMISSIONS.LAB_READ,
    PERMISSIONS.LAB_RESULT,
    PERMISSIONS.CATALOG_REQUEST,
  ],
  Testing: [
    PERMISSIONS.TEST_READ,
    PERMISSIONS.TEST_RESULT,
  ],
  Pharmacy: [
    PERMISSIONS.PRESCRIPTION_DISPENSE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.CATALOG_REQUEST,
  ],
};

export function getUserPermissions(roleStr: string | null | undefined): PermissionString[] {
  if (!roleStr) return [];
  // Normalize role string (e.g., 'receptionist' -> 'Reception', 'DataEncoder' -> 'Dataencoder')
  const r = roleStr.toLowerCase();
  let mappedRole = roleStr;
  
  if (r.includes("admin")) mappedRole = "Admin";
  else if (r.includes("manager")) mappedRole = "Manager";
  else if (r.includes("reception")) mappedRole = "Reception";
  else if (r.includes("dataencoder") || r.includes("data encoder")) mappedRole = "Dataencoder";
  else if (r.includes("doctor")) mappedRole = "Doctor";
  else if (r.includes("lab")) mappedRole = "Laboratory";
  else if (r.includes("pharmacy") || r.includes("pharmacist")) mappedRole = "Pharmacy";
  
  return ROLE_PERMISSIONS[mappedRole] || ROLE_PERMISSIONS[roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase()] || [];
}
