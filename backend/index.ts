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
import { dbOptimization, getSaleWithItems, getItemsPaginated
