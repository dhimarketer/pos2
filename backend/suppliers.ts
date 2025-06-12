// backend/suppliers.ts

export interface Supplier {
  id: number;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
}

let suppliers: Supplier[] = [];

export function createSupplier(
  companyName: string,
  contactPerson: string,
  phone: string,
  email: string,
  address: string,
  paymentTerms: string
): Supplier {
  const id = Math.floor(Math.random() * 1000);
  const newSupplier: Supplier = { id, companyName, contactPerson, phone, email, address, paymentTerms };
  suppliers.push(newSupplier);
  return newSupplier;
}

export function getSupplier(id: number): Supplier | undefined {
  return suppliers.find((supplier) => supplier.id === id);
}

export function updateSupplier(id: number, updates: Partial<Supplier>): Supplier | undefined {
  const supplierIndex = suppliers.findIndex((supplier) => supplier.id === id);
  if (supplierIndex === -1) {
    return undefined;
  }
  suppliers[supplierIndex] = { ...suppliers[supplierIndex], ...updates };
  return suppliers[supplierIndex];
}

export function deleteSupplier(id: number): boolean {
  const supplierIndex = suppliers.findIndex((supplier) => supplier.id === id);
  if (supplierIndex === -1) {
    return false;
  }
  suppliers.splice(supplierIndex, 1);
  return true;
}
