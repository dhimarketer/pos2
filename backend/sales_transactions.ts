import { db } from './index'; // Assuming 'db' is the database connection
import { getItem, adjustStockLevel } from './items';
import { logAction } from './audit';

export interface SaleItem {
  itemId: number;
  quantity: number;
  price: number; // Price at the time of sale
}

export interface Sale {
  id?: number;
  customerId?: number;
  saleDate: string; // ISO date string
  totalAmount: number;
  paymentMethod: string;
  items: SaleItem[];
}

export async function createSale(sale: Sale): Promise<number | undefined> {
  // First, validate that we have enough inventory for all items
  for (const item of sale.items) {
    const inventoryItem = await getItem(item.itemId);
    if (!inventoryItem) {
      console.error(`Item with ID ${item.itemId} not found`);
      return undefined;
    }
    
    if (inventoryItem.stock < item.quantity) {
      console.error(`Not enough stock for item ${inventoryItem.name} (ID: ${item.itemId}). Requested: ${item.quantity}, Available: ${inventoryItem.stock}`);
      return undefined;
    }
  }
  
  // Use a transaction to ensure all operations succeed or fail together
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Insert the sale record
    const result = await db.query(
      `INSERT INTO sales (customer_id, sale_date, total_amount, payment_method)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [sale.customerId, sale.saleDate, sale.totalAmount, sale.paymentMethod]
    );

    const saleId = result.rows[0].id;

    // Process each item in the sale
    for (const item of sale.items) {
      // Insert the sale item record
      await db.query(
        `INSERT INTO sale_items (sale_id, item_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [saleId, item.itemId, item.quantity, item.price]
      );
      
      // Update inventory levels in the database
      const updatedItem = await adjustStockLevel(item.itemId, -item.quantity);
      if (!updatedItem) {
        throw new Error(`Failed to update stock for item ID ${item.itemId}`);
      }
    }
    
    // Log the sale in the audit trail
    await logAction(1, 'Create Sale', `Created sale ID ${saleId} with ${sale.items.length} items for a total of ${sale.totalAmount}`);
    
    // Commit the transaction
    await db.query('COMMIT');
    
    return saleId;
  } catch (error) {
    // Rollback the transaction if any error occurs
    await db.query('ROLLBACK');
    console.error('Error creating sale:', error);
    return undefined;
  }
}

export async function getSaleById(id: number): Promise<Sale | undefined> {
  try {
    const saleResult = await db.query(`SELECT * FROM sales WHERE id = $1`, [id]);
    if (saleResult.rows.length === 0) {
      return undefined;
    }
    const saleRow = saleResult.rows[0];

    const itemResult = await db.query(`SELECT * FROM sale_items WHERE sale_id = $1`, [id]);
    const itemRows = itemResult.rows;

    const items: SaleItem[] = itemRows.map((row: any) => ({
      itemId: row.item_id,
      quantity: row.quantity,
      price: row.price,
    }));

    const sale: Sale = {
      id: saleRow.id,
      customerId: saleRow.customer_id,
      saleDate: saleRow.sale_date,
      totalAmount: saleRow.total_amount,
      paymentMethod: saleRow.payment_method,
      items: items,
    };

    return sale;
  } catch (error) {
    console.error(`Error getting sale with id ${id}:`, error);
    return undefined;
  }
}

/**
 * Updates an existing sale transaction.
 * This function handles updating the sale record and its items,
 * and adjusts inventory levels accordingly.
 * 
 * @param id The ID of the sale to update
 * @param updates The updated sale data
 * @returns The updated sale or undefined if the sale was not found or an error occurred
 */
export async function updateSale(id: number, updates: Partial<Sale>): Promise<Sale | undefined> {
  // First, get the existing sale to compare changes
  const existingSale = await getSaleById(id);
  if (!existingSale) {
    console.error(`Sale with ID ${id} not found for update`);
    return undefined;
  }

  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Update the sale record if there are base properties to update
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    if (updates.customerId !== undefined) {
      updateFields.push(`customer_id = $${paramIndex++}`);
      updateValues.push(updates.customerId);
    }
    
    if (updates.saleDate !== undefined) {
      updateFields.push(`sale_date = $${paramIndex++}`);
      updateValues.push(updates.saleDate);
    }
    
    if (updates.totalAmount !== undefined) {
      updateFields.push(`total_amount = $${paramIndex++}`);
      updateValues.push(updates.totalAmount);
    }
    
    if (updates.paymentMethod !== undefined) {
      updateFields.push(`payment_method = $${paramIndex++}`);
      updateValues.push(updates.paymentMethod);
    }
    
    // Update the sale record if there are fields to update
    if (updateFields.length > 0) {
      await db.query(
        `UPDATE sales SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        [...updateValues, id]
      );
    }
    
    // Handle item updates if provided
    if (updates.items && updates.items.length > 0) {
      // Create a map of existing items for easy lookup
      const existingItemsMap = new Map<number, SaleItem>();
      existingSale.items.forEach(item => {
        existingItemsMap.set(item.itemId, item);
      });
      
      // Create a map of updated items for easy lookup
      const updatedItemsMap = new Map<number, SaleItem>();
      updates.items.forEach(item => {
        updatedItemsMap.set(item.itemId, item);
      });
      
      // Process items to add or update
      for (const item of updates.items) {
        const existingItem = existingItemsMap.get(item.itemId);
        
        if (existingItem) {
          // Item exists, update it if quantity changed
          if (existingItem.quantity !== item.quantity) {
            // Calculate the difference in quantity
            const quantityDifference = existingItem.quantity - item.quantity;
            
            // Update the item in the sale_items table
            await db.query(
              `UPDATE sale_items SET quantity = $1, price = $2 WHERE sale_id = $3 AND item_id = $4`,
              [item.quantity, item.price, id, item.itemId]
            );
            
            // Adjust inventory (positive difference means returning items to inventory)
            await adjustStockLevel(item.itemId, quantityDifference);
          } else if (existingItem.price !== item.price) {
            // Only price changed, update without affecting inventory
            await db.query(
              `UPDATE sale_items SET price = $1 WHERE sale_id = $2 AND item_id = $3`,
              [item.price, id, item.itemId]
            );
          }
          
          // Remove from the map to track what's been processed
          existingItemsMap.delete(item.itemId);
        } else {
          // New item, add it
          // First check if we have enough inventory
          const inventoryItem = await getItem(item.itemId);
          if (!inventoryItem) {
            throw new Error(`Item with ID ${item.itemId} not found`);
          }
          
          if (inventoryItem.stock < item.quantity) {
            throw new Error(`Not enough stock for item ${inventoryItem.name} (ID: ${item.itemId}). Requested: ${item.quantity}, Available: ${inventoryItem.stock}`);
          }
          
          // Add the new item to the sale
          await db.query(
            `INSERT INTO sale_items (sale_id, item_id, quantity, price) VALUES ($1, $2, $3, $4)`,
            [id, item.itemId, item.quantity, item.price]
          );
          
          // Adjust inventory
          await adjustStockLevel(item.itemId, -item.quantity);
        }
      }
      
      // Process items to remove (any remaining in existingItemsMap)
      for (const [itemId, item] of existingItemsMap.entries()) {
        // Remove the item from the sale
        await db.query(
          `DELETE FROM sale_items WHERE sale_id = $1 AND item_id = $2`,
          [id, itemId]
        );
        
        // Return the items to inventory
        await adjustStockLevel(itemId, item.quantity);
      }
    }
    
    // Log the update in the audit trail
    await logAction(1, 'Update Sale', `Updated sale ID ${id}`);
    
    // Commit the transaction
    await db.query('COMMIT');
    
    // Return the updated sale
    return await getSaleById(id);
  } catch (error) {
    // Rollback the transaction if any error occurs
    await db.query('ROLLBACK');
    console.error('Error updating sale:', error);
    return undefined;
  }
}

/**
 * Deletes a sale transaction and restores inventory levels.
 * 
 * @param id The ID of the sale to delete
 * @returns True if the sale was successfully deleted, false otherwise
 */
export async function deleteSale(id: number): Promise<boolean> {
  // First, get the existing sale to restore inventory
  const existingSale = await getSaleById(id);
  if (!existingSale) {
    console.error(`Sale with ID ${id} not found for deletion`);
    return false;
  }
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Restore inventory for all items in the sale
    for (const item of existingSale.items) {
      // Return the items to inventory (positive quantity)
      await adjustStockLevel(item.itemId, item.quantity);
    }
    
    // Delete the sale items
    await db.query('DELETE FROM sale_items WHERE sale_id = $1', [id]);
    
    // Delete the sale
    const result = await db.query('DELETE FROM sales WHERE id = $1', [id]);
    
    // Log the deletion in the audit trail
    await logAction(1, 'Delete Sale', `Deleted sale ID ${id}`);
    
    // Commit the transaction
    await db.query('COMMIT');
    
    return result.rowCount > 0;
  } catch (error) {
    // Rollback the transaction if any error occurs
    await db.query('ROLLBACK');
    console.error('Error deleting sale:', error);
    return false;
  }
}

// TODO: Add functions for reporting on sales
