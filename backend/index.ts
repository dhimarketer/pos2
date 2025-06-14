const express = require('express');
import { Reports, ReportType, ReportFilterOptions } from './reports';
import { createUser, getUser, updateUser, deleteUser } from './user';
import { Role } from './permissions';
import { logAction, getAuditLogs } from './audit';
import { createItem, getItem, updateItem, deleteItem, adjustStockLevel } from './items';
import { createCustomer, getCustomer, updateCustomer, deleteCustomer } from './customers';
import { createSupplier, getSupplier, updateSupplier, deleteSupplier } from './suppliers';
import { createPurchaseOrder, getPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, PurchaseOrder } from './purchase_orders';
import { createSale, getSaleById, updateSale, deleteSale } from './sales_transactions';
import { PurchaseManagement } from './purchase_management';
import { dbOptimization, getSaleWithItems, getItemsPaginated, getSalesPaginated } from './database_optimization';
import { validate, userSchemas, itemSchemas, customerSchemas, supplierSchemas, purchaseOrderSchemas, salesTransactionSchemas, reportSchemas, validateIdParam, validatePagination } from './validation';
import { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from './error-handler';

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
  max: parseInt(process.env.DB_MAX_POOL_SIZE || '20'), // Maximum number of clients in the pool
  min: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),  // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'), // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // How long to wait for a connection
});

export { pool as db };

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

// Apply error handler middleware
app.use(errorHandler);

// User registration function
async function registerUser(username: string, password: string, role: string): Promise<{ token: string }> {
  console.log('Registering user');
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await createUser(username, hashedPassword, role as Role);
  // Generate JWT token for the new user
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { token };
}

// Placeholder function for user login
async function loginUser(username: string, password: string): Promise<{ token: string } | undefined> {
  console.log('Logging in user');
  // Implement user login logic here
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Passwords match, generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token };
}

// Function to check if token is about to expire
function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return false;
    
    // Check if token will expire in the next 5 minutes (300 seconds)
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    return timeUntilExpiry > 0 && timeUntilExpiry < 300000; // Less than 5 minutes
  } catch (err) {
    return false;
  }
}

// Middleware to verify JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // if there isn't any token
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403); // if token is not valid
    }
    
    // Check if token is about to expire and add a warning header
    if (isTokenExpiringSoon(token)) {
      res.set('X-Session-Expiring-Soon', 'true');
    }
    
    req.user = user;
    next();
  });
}

app.post('/login', asyncHandler(async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    const user = await loginUser(username, password);

    res.status(200).json(user);
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send('Server error');
  }
}));

app.post('/register', validate(userSchemas.create), asyncHandler(async (req: any, res: any) => {
  try {
    const { username, password, role } = req.body;
    
    // Validate role
    if (role !== 'Manager' && role !== 'Cashier') {
      return res.status(400).send('Invalid role. Must be either "Manager" or "Cashier"');
    }
    
    // Check if username already exists
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      throw new DatabaseError('Username already exists', 'SELECT * FROM users WHERE username = $1', [username]);
    }
    
    const tokenObj = await registerUser(username, password, role);
    await logAction(1, 'User Registration', `Registered user ${username} with role ${role}`);
    res.status(201).json(tokenObj);
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send('Server error');
  }
}));

app.post('/users', authenticateToken, validate(userSchemas.create), asyncHandler(async (req: any, res: any) => {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, hashedPassword, roleObject);
    await logAction(1, 'Create User', `Created user ${username} with role ${role}`);
    console.log(`Creating user ${username} with role ${role}`);
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/users/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
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
}));

app.put('/users/:id', authenticateToken, validateIdParam, validate(userSchemas.update), asyncHandler(async (req: any, res: any) => {
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
}));

app.delete('/users/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteUser(id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/audit', authenticateToken, asyncHandler(async (req: any, res: any) => {
  try {
    const auditLogs = getAuditLogs();
    res.status(200).json(auditLogs);
  } catch (err) {
    console.error("Error getting audit logs:", err);
    res.status(500).send('Server error');
  }
}));

app.post('/items', authenticateToken, validate(itemSchemas.create), asyncHandler(async (req: any, res: any) => {
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
}));

app.get('/items/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
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
}));

app.put('/items/:id', authenticateToken, validateIdParam, validate(itemSchemas.update), asyncHandler(async (req: any, res: any) => {
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
}));

app.delete('/items/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteItem(id);
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
}));

app.post('/customers', authenticateToken, validate(customerSchemas.create), asyncHandler(async (req: any, res: any) => {
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
}));

app.get('/customers/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
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
}));

app.put('/customers/:id', authenticateToken, validateIdParam, validate(customerSchemas.update), asyncHandler(async (req: any, res: any) => {
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
}));

app.delete('/customers/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteCustomer(id);
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
}));

app.post('/suppliers', authenticateToken, validate(supplierSchemas.create), asyncHandler(async (req: any, res: any) => {
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
}));

app.get('/suppliers/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
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
}));

app.put('/suppliers/:id', authenticateToken, validateIdParam, validate(supplierSchemas.update), asyncHandler(async (req: any, res: any) => {
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
}));

app.delete('/suppliers/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteSupplier(id);
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
}));

app.post('/items/:id/stock', authenticateToken, validateIdParam, validate(itemSchemas.adjustStock), asyncHandler(async (req: any, res: any) => {
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
}));

async function createPurchaseOrderWithItems(supplierId: number, items: { itemId: number; quantity: number; costPrice: number }[]): Promise<PurchaseOrder[]> {
  const createdOrders: PurchaseOrder[] = [];
  for (const item of items) {
    const newOrder = await createPurchaseOrder(supplierId, item.itemId, item.quantity, item.costPrice);
    createdOrders.push(newOrder);
  }
  return createdOrders;
}

app.post('/purchase_orders', authenticateToken, validate(purchaseOrderSchemas.create), asyncHandler(async (req: any, res: any) => {
  try {
    const { supplierId, items } = req.body;

    // Assuming items is an array of { itemId, quantity, costPrice }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send('Items array is required and cannot be empty.');
    }

    const createdOrders = await createPurchaseOrderWithItems(supplierId, items);

    // Log action for the batch creation
    await logAction(1, 'Create Purchase Orders', `Created ${createdOrders.length} purchase order entries for supplier ${supplierId}`);
    console.log(`Created ${createdOrders.length} purchase order entries for supplier ${supplierId}`);

    res.status(201).json(createdOrders);
  } catch (err) {
    console.error("Error creating purchase orders:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/purchase_orders/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const purchaseOrder = await getPurchaseOrder(id); // Await the promise
    if (purchaseOrder) {
      res.status(200).json(purchaseOrder);
    } else {
      res.status(404).send('Purchase order not found');
    }
  } catch (err) {
    console.error("Error getting purchase order:", err);
    res.status(500).send('Server error');
  }
}));

app.put('/purchase_orders/:id', authenticateToken, validateIdParam, validate(purchaseOrderSchemas.update), asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedPurchaseOrder = await updatePurchaseOrder(id, updates); // Await the promise
    if (updatedPurchaseOrder) {
      res.status(200).json(updatedPurchaseOrder);
    } else {
      res.status(404).send('Purchase order not found');
    }
  } catch (err) {
    console.error("Error updating purchase order:", err);
    res.status(500).send('Server error');
  }
}));

app.delete('/purchase_orders/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deletePurchaseOrder(id); // Await the promise
    if (deleted) {
      await logAction(1, 'Delete Purchase Order', `Deleted purchase order with id ${id}`);
      res.status(204).send();
    } else {
      res.status(404).send('Purchase order not found');
    }
  } catch (err) {
    console.error("Error deleting purchase order:", err);
    res.status(500).send('Server error');
  }
}));

app.post('/sales_transactions', authenticateToken, validate(salesTransactionSchemas.create), asyncHandler(async (req: any, res: any) => {
  try {
    const sale = req.body; // Assuming the request body is a Sale object
    const saleId = await createSale(sale);
    if (saleId) {
      await logAction(1, 'Create Sales Transaction', `Created sales transaction with id ${saleId}`);
      console.log(`Creating sales transaction with id ${saleId}`);
      res.status(201).json({ id: saleId });
    } else {
      res.status(500).send('Error creating sales transaction');
    }
  } catch (err) {
    console.error("Error creating sales transaction:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/sales_transactions/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const salesTransaction = await getSaleById(id);
    if (salesTransaction) {
      res.status(200).json(salesTransaction);
    } else {
      res.status(404).send('Sales transaction not found');
    }
  } catch (err) {
    console.error("Error getting sales transaction:", err);
    res.status(500).send('Server error');
  }
}));

app.put('/sales_transactions/:id', authenticateToken, validateIdParam, validate(salesTransactionSchemas.update), asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has permission to edit sales
    if (req.user.role !== Role.Manager) {
      throw new AuthorizationError('Only managers can edit sales transactions');
    }
    
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updatedSale = await updateSale(id, updates);
    
    if (updatedSale) {
      await logAction(req.user.id, 'Update Sales Transaction', `Updated sales transaction with id ${id}`);
      res.status(200).json(updatedSale);
    } else {
      res.status(404).send('Sales transaction not found or update failed');
    }
  } catch (err) {
    console.error("Error updating sales transaction:", err);
    res.status(500).send('Server error');
  }
}));

app.delete('/sales_transactions/:id', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has permission to delete sales
    if (req.user.role !== Role.Manager) {
      throw new AuthorizationError('Only managers can delete sales transactions');
    }
    
    const id = parseInt(req.params.id);
    const deleted = await deleteSale(id);
    
    if (deleted) {
      await logAction(req.user.id, 'Delete Sales Transaction', `Deleted sales transaction with id ${id}`);
      res.status(204).send();
    } else {
      res.status(404).send('Sales transaction not found or delete failed');
    }
  } catch (err) {
    console.error("Error deleting sales transaction:", err);
    res.status(500).send('Server error');
  }
}));

// Optimized API endpoints
app.get('/api/items', authenticateToken, validatePagination, asyncHandler(async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page || '1');
    const pageSize = parseInt(req.query.pageSize || '20');
    const filters = {
      category: req.query.category,
      name: req.query.name,
      minStock: req.query.minStock ? parseInt(req.query.minStock) : undefined,
      maxStock: req.query.maxStock ? parseInt(req.query.maxStock) : undefined
    };
    
    const result = await getItemsPaginated(page, pageSize, filters);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting paginated items:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/api/sales', authenticateToken, validatePagination, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has permission to access sales data
    if (req.user.role !== 'Manager' && req.user.role !== 'Cashier') {
      throw new AuthorizationError('Insufficient permissions');
    }
    
    const page = parseInt(req.query.page || '1');
    const pageSize = parseInt(req.query.pageSize || '20');
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      customerId: req.query.customerId ? parseInt(req.query.customerId) : undefined,
      paymentMethod: req.query.paymentMethod
    };
    
    const result = await getSalesPaginated(page, pageSize, filters);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting paginated sales:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/api/sales/:id/details', authenticateToken, validateIdParam, asyncHandler(async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await getSaleWithItems(id);
    
    if (sale) {
      res.status(200).json(sale);
    } else {
      res.status(404).send('Sale not found');
    }
  } catch (err) {
    console.error("Error getting sale details:", err);
    res.status(500).send('Server error');
  }
}));

app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has permission to access dashboard stats
    if (req.user.role !== 'Manager') {
      throw new AuthorizationError('Only managers can access dashboard statistics');
    }
    
    const stats = await dbOptimization.executeQuery(`
      SELECT
        (SELECT COUNT(*) FROM items) as total_items,
        (SELECT COUNT(*) FROM items WHERE stock <= 10) as low_stock_items,
        (SELECT COUNT(*) FROM sales WHERE sale_date >= NOW() - INTERVAL '30 days') as sales_last_30_days,
        (SELECT SUM(total_amount) FROM sales WHERE sale_date >= NOW() - INTERVAL '30 days') as revenue_last_30_days,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers
    `);
    
    res.status(200).json(stats.rows[0]);
  } catch (err) {
    console.error("Error getting dashboard stats:", err);
    res.status(500).send('Server error');
  }
}));

// Endpoint to get slow queries for performance monitoring
app.get('/api/admin/slow-queries', authenticateToken, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'Manager') {
      throw new AuthorizationError('Only managers can access performance monitoring');
    }
    
    const threshold = parseInt(req.query.threshold || '100');
    const limit = parseInt(req.query.limit || '100');
    
    const slowQueries = await dbOptimization.getSlowQueries(threshold, limit);
    res.status(200).json(slowQueries);
  } catch (err) {
    console.error("Error getting slow queries:", err);
    res.status(500).send('Server error');
  }
}));

// Endpoint to optimize a specific table
app.post('/api/admin/optimize-table', authenticateToken, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'Manager') {
      throw new AuthorizationError('Only managers can perform database optimization');
    }
    
    const { tableName } = req.body;
    
    if (!tableName) {
      return res.status(400).send('Table name is required');
    }
    
    await dbOptimization.optimizeTable(tableName);
    res.status(200).json({ message: `Table ${tableName} optimized successfully` });
  } catch (err) {
    console.error("Error optimizing table:", err);
    res.status(500).send('Server error');
  }
}));

// Reports endpoints
const reportsInstance = new Reports();

app.get('/reports/:reportType', authenticateToken, validate(reportSchemas.generate), asyncHandler(async (req: any, res: any) => {
  try {
    // Check if user has permission to access reports
    if (req.user.role !== 'Manager') {
      return res.status(403).send('Only managers can access reports');
    }
    
    const reportType = req.params.reportType;
    const filterOptions: ReportFilterOptions = req.query;
    
    // Convert string parameters to appropriate types
    if (filterOptions.itemId) filterOptions.itemId = parseInt(filterOptions.itemId as unknown as string);
    if (filterOptions.customerId) filterOptions.customerId = parseInt(filterOptions.customerId as unknown as string);
    if (filterOptions.userId) filterOptions.userId = parseInt(filterOptions.userId as unknown as string);
    if (filterOptions.stockThreshold) filterOptions.stockThreshold = parseInt(filterOptions.stockThreshold as unknown as string);
    if (filterOptions.limit) filterOptions.limit = parseInt(filterOptions.limit as unknown as string);
    if (filterOptions.page) filterOptions.page = parseInt(filterOptions.page as unknown as string);
    
    // Validate report type
    if (!Object.values(ReportType).includes(reportType as ReportType)) {
      throw new NotFoundError(`Invalid report type: ${reportType}`);
    }
    
    const reportData = await reportsInstance.generateReport(reportType as ReportType, filterOptions);
    res.status(200).json(reportData);
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).send('Server error');
  }
}));

// Start the server
setupDatabase().then(async () => {
  try {
    // Initialize database optimizations
    await dbOptimization.initialize();
    console.log('Database optimizations initialized');
    
    // Analyze tables to update statistics for the query planner
    await dbOptimization.analyzeTables();
    console.log('Database tables analyzed');
  } catch (error) {
    console.error('Error initializing database optimizations:', error);
    // Continue server startup even if optimizations fail
  }
  
  // Handle 404 for all other routes
app.use(notFoundHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
