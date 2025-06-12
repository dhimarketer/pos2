// backend/customers.ts

export interface Customer {
  id: number;
  name: string;
  contactInfo: string;
  address: string;
  purchaseHistory: string;
}

let customers: Customer[] = [];

export function createCustomer(name: string, contactInfo: string, address: string, purchaseHistory: string): Customer {
  const id = Math.floor(Math.random() * 1000);
  const newCustomer: Customer = { id, name, contactInfo, address, purchaseHistory };
  customers.push(newCustomer);
  return newCustomer;
}

export function getCustomer(id: number): Customer | undefined {
  return customers.find((customer) => customer.id === id);
}

export function updateCustomer(id: number, updates: Partial<Customer>): Customer | undefined {
  const customerIndex = customers.findIndex((customer) => customer.id === id);
  if (customerIndex === -1) {
    return undefined;
  }
  customers[customerIndex] = { ...customers[customerIndex], ...updates };
  return customers[customerIndex];
}

export function deleteCustomer(id: number): boolean {
  const customerIndex = customers.findIndex((customer) => customer.id === id);
  if (customerIndex === -1) {
    return false;
  }
  customers.splice(customerIndex, 1);
  return true;
}
