export enum Role {
  Manager = 'Manager',
  Cashier = 'Cashier',
}

export const rolePermissions = {
  [Role.Manager]: {
    'user:create': true,
    'user:read': true,
    'user:update': true,
    'user:delete': true,
    'item:create': true,
    'item:read': true,
    'item:update': true,
    'item:delete': true,
    'customer:create': true,
    'customer:read': true,
    'customer:update': true,
    'customer:delete': true,
    'supplier:create': true,
    'supplier:read': true,
    'supplier:update': true,
    'supplier:delete': true,
    'sales:read': true,
    'sales:edit': true, // Sales Bill Edit Function (Manager Only)
    'report:read': true,
    'audit:read': true,
    'permission:manage': true,
    'inventory:adjust': true,
    'purchase:create': true,
    'purchase:read': true,
    'purchase:update': true,
    'purchase:delete': true,
    'settings:manage': true,
  },
  [Role.Cashier]: {
    'item:read': true,
    'customer:read': true,
    'sales:create': true,
    'sales:read': true,
    'report:read': true, // Limited reports
    'inventory:adjust': true, // "No Sale" function for cash drawer use.
    'purchase:read': true,
  },
};

export function checkPermission(role: Role, permission: string): boolean {
  return rolePermissions[role]?.[permission] || false;
}
