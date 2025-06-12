// backend/sales_transactions.ts

import { logAction } from './audit';

interface SalesTransaction {
  id: number;
  itemId: number;
  customerId: number;
  quantity: number;
  price: number;
  saleDate: string;
  paymentType: string;
}

let salesTransactions: SalesTransaction[] = [];

export async function createSalesTransaction(itemId: number, customerId: number, quantity: number, price: number, saleDate: string, paymentType: string): Promise<SalesTransaction> {
  const id = salesTransactions.length > 0 ? Math.max(...salesTransactions.map(st => st.id)) + 1 : 1;
  const newSalesTransaction = { id, itemId, customerId, quantity, price, saleDate, paymentType };
  salesTransactions.push(newSalesTransaction);
  await logAction(1, 'Create Sales Transaction', `Created sales transaction with id ${id}`);
  console.log(`Creating sales transaction with id ${id}`);
  return newSalesTransaction;
}

export function getSalesTransaction(id: number): SalesTransaction | undefined {
  return salesTransactions.find(st => st.id === id);
}

export async function updateSalesTransaction(id: number, updates: Partial<SalesTransaction>): Promise<SalesTransaction | undefined> {
  const salesTransaction = salesTransactions.find(st => st.id === id);
  if (salesTransaction) {
    Object.assign(salesTransaction, updates);
    await logAction(1, 'Update Sales Transaction', `Updated sales transaction with id ${id}`);
    return salesTransaction;
  }
  return undefined;
}

export async function deleteSalesTransaction(id: number): Promise<boolean> {
  const index = salesTransactions.findIndex(st => st.id === id);
  if (index !== -1) {
    salesTransactions.splice(index, 1);
    await logAction(1, 'Delete Sales Transaction', `Deleted sales transaction with id ${id}`);
    return true;
  }
  return false;
}
