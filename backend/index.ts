const express = require('express');
import { Reports } from './reports';
import { createUser, getUser, updateUser, deleteUser } from './user';
import { Role } from './permissions';
import { logAction, getAuditLogs } from './audit';
import { createItem, getItem, updateItem, deleteItem, adjustStockLevel } from './items';
import { createCustomer, getCustomer, updateCustomer, deleteCustomer } from './customers';
import { createSupplier, getSupplier, updateSupplier, deleteSupplier } from './suppliers';
import { createPurchaseOrder, getPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from './purchase_orders';
import { createSalesTransaction, getSalesTransaction, updateSalesTransaction, deleteSalesTransaction } from './sales_transactions';
import { PurchaseManagement } from './purchase_management';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const users = [];

// Placeholder function for database setup
async function setupDatabase() {
  console.log('Setting up the database...');
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT UNIQUE,
      description TEXT,
      category TEXT,
      costPrice REAL,
      packagingUnit TEXT,
      stock INTEGER,
      multiLevelPricing TEXT,
      status TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT,
      contactInfo TEXT,
      address TEXT,
      purchaseHistory TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      companyName TEXT,
      contactPerson TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      paymentTerms TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplierId INTEGER,
      itemId INTEGER,
      quantity INTEGER,
      cost REAL,
      orderDate TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS sales_transactions (
      id SERIAL PRIMARY KEY,
      itemId INTEGER,
      customerId INTEGER,
      quantity INTEGER,
      price REAL,
      saleDate TEXT,
      paymentType TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS audit_trail (
      id SERIAL PRIMARY KEY,
      userId INTEGER,
      action TEXT,
      description TEXT,
      timestamp TEXT
    );`);

    console.log('Database setup complete.');
  } catch (err) {
    console.error("Error setting up database:", err);
  }
}

const app = express();
const port = 3000;

app.use(express.json());

// Placeholder function for user registration
async function registerUser(username: string, password: string, role: string): Promise<{ token: string }> {
  console.log('Placeholder: Registering user');
  // TODO: Implement user registration logic here
  return { token: 'dummy_token' };
}

// Placeholder function for user login
async function loginUser(username: string, password: string): Promise<{ token: string }> {
  console.log('Placeholder: Logging in user');
  // TODO: Implement user login logic here
  return { token: 'dummy_token' };
}

app.post('/users', async (req: any, res: any) => {
  try {
    const { username, password, role } = req.body;
    let roleObject;
    if (role === 'Manager') {
      roleObject = Role.Manager;
    } else if (role === 'Cashier') {
      roleObject = Role.Cashier;
    } else {
      return res.status(400).send('Invalid role');
    }
    const newUser = createUser(username, roleObject);
    await logAction(1, 'Create User', `Created user ${username} with role ${role}`);
    console.log(`Creating user ${username} with role ${role}`);
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send('Server error');
  }
});

app.get('/users/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error getting user:", err);
    res.status(500).send('Server error');
  }
});

app.put('/users/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedUser = updateUser(id, updates);
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send('Server error');
  }
});

app.delete('/users/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteUser(id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send('Server error');
  }
});

app.get('/audit', async (req: any, res: any) => {
  try {
    const auditLogs = getAuditLogs();
    res.status(200).json(auditLogs);
  } catch (err) {
    console.error("Error getting audit logs:", err);
    res.status(500).send('Server error');
  }
});

app.post('/items', async (req: any, res: any) => {
  try {
    const { sku, name, description, category, costPrice, packagingUnit, stockLevel, multiLevelPricing, status } = req.body;
    const newItem = createItem(sku, name, description, category, costPrice, packagingUnit, stockLevel, multiLevelPricing, status);
    logAction(1, 'Create Item', `Created item ${name} with sku ${sku}`);
    console.log(`Creating item ${name} with sku ${sku}`);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).send('Server error');
  }
});

app.get('/items/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const item = getItem(id);
    if (item) {
      res.status(200).json(item);
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    console.error("Error getting item:", err);
    res.status(500).send('Server error');
  }
});

app.put('/items/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedItem = updateItem(id, updates);
    if (updatedItem) {
      res.status(200).json(updatedItem);
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).send('Server error');
  }
});

app.delete('/items/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteItem(id);
    if (deleted) {
      await logAction(1, 'Delete Item', `Deleted item with id ${id}`);
      res.status(204).send();
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).send('Server error');
  }
});

app.post('/customers', async (req: any, res: any) => {
  try {
    const { name, contactInfo, address, purchaseHistory } = req.body;
    const newCustomer = createCustomer(name, contactInfo, address, purchaseHistory);
    await logAction(1, 'Create Customer', `Created customer ${name}`);
    console.log(`Creating customer ${name}`);
    res.status(201).json(newCustomer);
  } catch (err) {
    console.error("Error creating customer:", err);
    res.status(500).send('Server error');
  }
});

app.get('/customers/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const customer = getCustomer(id);
    if (customer) {
      res.status(200).json(customer);
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (err) {
    console.error("Error getting customer:", err);
    res.status(500).send('Server error');
  }
});

app.put('/customers/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedCustomer = updateCustomer(id, updates);
    if (updatedCustomer) {
      res.status(200).json(updatedCustomer);
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).send('Server error');
  }
});

app.delete('/customers/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteCustomer(id);
    if (deleted) {
      await logAction(1, 'Delete Customer', `Deleted customer with id ${id}`);
      res.status(204).send();
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).send('Server error');
  }
});

app.post('/suppliers', async (req: any, res: any) => {
  try {
    const { companyName, contactPerson, phone, email, address, paymentTerms } = req.body;
    const newSupplier = createSupplier(companyName, contactPerson, phone, email, address, paymentTerms);
    await logAction(1, 'Create Supplier', `Created supplier ${companyName}`);
    console.log(`Creating supplier ${companyName}`);
    res.status(201).json(newSupplier);
  } catch (err) {
    console.error("Error creating supplier:", err);
    res.status(500).send('Server error');
  }
});

app.get('/suppliers/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const supplier = getSupplier(id);
    if (supplier) {
      res.status(200).json(supplier);
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (err) {
    console.error("Error getting supplier:", err);
    res.status(500).send('Server error');
  }
});

app.put('/suppliers/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedSupplier = updateSupplier(id, updates);
    if (updatedSupplier) {
      res.status(200).json(updatedSupplier);
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (err) {
    console.error("Error updating supplier:", err);
    res.status(500).send('Server error');
  }
});

app.delete('/suppliers/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteSupplier(id);
    if (deleted) {
      await logAction(1, 'Delete Supplier', `Deleted supplier with id ${id}`);
      res.status(204).send();
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (err) {
    console.error("Error deleting supplier:", err);
    res.status(500).send('Server error');
  }
});

app.post('/items/:id/stock', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const updatedItem = adjustStockLevel(id, quantity);
    if (updatedItem) {
      await logAction(1, 'Adjust Stock Level', `Adjusted stock level for item with id ${id} by ${quantity}`);
      res.status(200).json(updatedItem);
    } else {
      res.status(404).send('Item not found');
    }
  } catch (err) {
    console.error("Error adjusting stock level:", err);
    res.status(500).send('Server error');
  }
});

async function createPurchaseOrderWithItems(supplierId: number, items: any[]) {
  // Fetch supplier and items from database based on IDs
  const supplierResult = await pool.query('SELECT * FROM suppliers WHERE id = $1', [supplierId]);
  const supplier = supplierResult.rows[0];

  const purchaseOrderItems = [];
  for (const item of items) {
    const itemResult = await pool.query('SELECT * FROM items WHERE id = $1', [item.itemId]);
    const itemData = itemResult.rows[0];
    purchaseOrderItems.push({ itemId: item.itemId, quantity: item.quantity, price: itemData.costPrice });
  }

  return createPurchaseOrder(supplier, purchaseOrderItems);
}

app.post('/purchase_orders', async (req: any, res: any) => {
  try {
    const { supplierId, items } = req.body;

    const newPurchaseOrder = await createPurchaseOrderWithItems(supplierId, items);
    await logAction(1, 'Create Purchase Order', `Created purchase order with id ${newPurchaseOrder.id}`);
    console.log(`Creating purchase order with id ${newPurchaseOrder.id}`);
    res.status(201).json(newPurchaseOrder);
  } catch (err) {
    console.error("Error creating purchase order:", err);
    res.status(500).send('Server error');
  }
});

app.get('/purchase_orders/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const purchaseOrder = getPurchaseOrder(id);
    if (purchaseOrder) {
      res.status(200).json(purchaseOrder);
    } else {
      res.status(404).send('Purchase order not found');
    }
  } catch (err) {
    console.error("Error getting purchase order:", err);
    res.status(500).send('Server error');
  }
});

app.put('/purchase_orders/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedPurchaseOrder = updatePurchaseOrder(id, updates);
    if (updatedPurchaseOrder) {
      res.status(200).json(updatedPurchaseOrder);
    } else {
      res.status(404).send('Purchase order not found');
    }
  } catch (err) {
        console.error("Error updating purchase order:", err);
        res.status(500).send('Server error');
      }
    });

    app.delete('/purchase_orders/:id', async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id);
        deletePurchaseOrder(id);
        await logAction(1, 'Delete Purchase Order', `Deleted purchase order with id ${id}`);
        res.status(204).send();
      } catch (err) {
        console.error("Error deleting purchase order:", err);
        res.status(500).send('Server error');
      }
    });

app.post('/sales_transactions', async (req: any, res: any) => {
  try {
    const { itemId, customerId, quantity, price, saleDate, paymentType } = req.body;
    const newSalesTransaction = await createSalesTransaction(itemId, customerId, quantity, price, saleDate, paymentType);
    await logAction(1, 'Create Sales Transaction', `Created sales transaction with id ${newSalesTransaction.id}`);
    console.log(`Creating sales transaction with id ${newSalesTransaction.id}`);
    res.status(201).json(newSalesTransaction);
  } catch (err) {
    console.error("Error creating sales transaction:", err);
    res.status(500).send('Server error');
  }
});

app.get('/sales_transactions/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const salesTransaction = getSalesTransaction(id);
    if (salesTransaction) {
      res.status(200).json(salesTransaction);
    } else {
      res.status(404).send('Sales transaction not found');
    }
  } catch (err) {
    console.error("Error getting sales transaction:", err);
    res.status(500).send('Server error');
  }
});

app.put('/sales_transactions/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedSalesTransaction = updateSalesTransaction(id, updates);
    if (updatedSalesTransaction) {
      res.status(200).json(updatedSalesTransaction);
    } else {
      res.status(404).send('Sales transaction not found');
    }
  } catch (err) {
    console.error("Error updating sales transaction:", err);
    res.status(500).send('Server error');
  }
});

app.delete('/sales_transactions/:id', async (req: any, res: any) => {
  const reports = new Reports();
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteSalesTransaction(id);
    if (deleted) {
      await logAction(1, 'Delete Sales Transaction', `Deleted sales transaction with id ${id}`);
      res.status(204).send();
    } else {
      res.status(404).send('Sales transaction not found');
    }
  } catch (err) {
    console.error("Error deleting sales transaction:", err);
    res.status(500).send('Server error');
  }
});

// Start the server
setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
