// backend/items.ts

export interface Item {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  packagingUnit: string;
  stockLevel: number;
  multiLevelPricing: string;
  status: string;
}

let items: Item[] = [];

export function createItem(
  sku: string,
  name: string,
  description: string,
  category: string,
  costPrice: number,
  packagingUnit: string,
  stockLevel: number,
  multiLevelPricing: string,
  status: string
): Item {
  const id = Math.floor(Math.random() * 1000);
  const newItem: Item = {
    id,
    sku,
    name,
    description,
    category,
    costPrice,
    packagingUnit,
    stockLevel,
    multiLevelPricing,
    status,
  };
  items.push(newItem);
  return newItem;
}

export function getItem(id: number): Item | undefined {
  return items.find((item) => item.id === id);
}

export function updateItem(id: number, updates: Partial<Item>): Item | undefined {
  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    return undefined;
  }
  items[itemIndex] = { ...items[itemIndex], ...updates };
  return items[itemIndex];
}

export function adjustStockLevel(id: number, quantity: number): Item | undefined {
  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    return undefined;
  }
  items[itemIndex].stockLevel += quantity;
  return items[itemIndex];
}

export function deleteItem(id: number): boolean {
  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    return false;
  }
  items.splice(itemIndex, 1);
  return true;
}
