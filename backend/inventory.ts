// backend/inventory.ts

/**
 * Manages inventory levels, stock alerts, and adjustments.
 */

import { Item } from './items'; // Assuming Item interface is defined in items.ts

interface InventoryItem {
  item: Item;
  quantity: number;
  minStockLevel: number;
}

let inventory: InventoryItem[] = [];

/**
 * Adds an item to the inventory or updates the quantity if it already exists.
 * @param item The item to add or update.
 * @param quantity The quantity to add.
 */
export function updateInventory(item: Item, quantity: number): void {
  const existingItem = inventory.find((i) => i.item.sku === item.sku);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    inventory.push({
      item: item,
      quantity: quantity,
      minStockLevel: 10, // Default minimum stock level
    });
  }
}

/**
 * Retrieves the current stock level for a given item.
 * @param item The item to check.
 * @returns The current stock level.
 */
export function getStockLevel(item: Item): number {
  const inventoryItem = inventory.find((i) => i.item.sku === item.sku);
  return inventoryItem ? inventoryItem.quantity : 0;
}

/**
 * Sets the minimum stock level for a given item.
 * @param item The item to update.
 * @param minStockLevel The new minimum stock level.
 */
export function setMinStockLevel(item: Item, minStockLevel: number): void {
  const inventoryItem = inventory.find((i) => i.item.sku === item.sku);
  if (inventoryItem) {
    inventoryItem.minStockLevel = minStockLevel;
  }
}

/**
 * Checks if the stock level for any items is below the minimum stock level.
 * @returns An array of items that are below their minimum stock level.
 */
export function getLowStockItems(): InventoryItem[] {
  return inventory.filter((i) => i.quantity < i.minStockLevel);
}

/**
 * Adjusts the inventory level for a given item.
 * @param item The item to adjust.
 * @param quantity The quantity to adjust by (can be positive or negative).
 * @param reasonCode The reason for the adjustment.
 */
export function adjustInventory(item: Item, quantity: number, reasonCode: string): void {
  updateInventory(item, quantity);
  // TODO: Implement audit trail logging
  console.log(`Inventory adjusted for item ${item.sku} by ${quantity} due to ${reasonCode}`);
}

/**
 * "No Sale" function for cash drawer use.
 */
export function noSale(): void {
  // TODO: Implement cash drawer functionality
  console.log('No Sale function called');
}
