// This module handles the reporting and analytics functionality of the POS system.
import { db } from './index';
import { getAuditLogs } from './audit';

// Define report types
export enum ReportType {
    SALES_SUMMARY = 'sales_summary',
    SALES_BY_ITEM = 'sales_by_item',
    SALES_BY_CUSTOMER = 'sales_by_customer',
    SALES_BY_PAYMENT_METHOD = 'sales_by_payment_method',
    INVENTORY_CURRENT = 'inventory_current',
    INVENTORY_LOW_STOCK = 'inventory_low_stock',
    INVENTORY_MOVEMENT = 'inventory_movement',
    ITEM_PERFORMANCE = 'item_performance',
    FINANCIAL_REVENUE = 'financial_revenue',
    FINANCIAL_PROFIT = 'financial_profit',
    FINANCIAL_COGS = 'financial_cogs',
    AUDIT_USER_ACTIVITY = 'audit_user_activity',
    AUDIT_SYSTEM_CHANGES = 'audit_system_changes'
}

// Define filter options interface
export interface ReportFilterOptions {
    startDate?: string;
    endDate?: string;
    itemId?: number;
    customerId?: number;
    userId?: number;
    paymentMethod?: string;
    category?: string;
    stockThreshold?: number;
    limit?: number;
    page?: number;
    entityType?: string;
}

// Define report result interfaces
export interface SalesSummary {
    period: string;
    totalSales: number;
    totalRevenue: number;
    averageTransactionValue: number;
    transactionCount: number;
}

export interface SalesByItem {
    itemId: number;
    itemName: string;
    quantitySold: number;
    revenue: number;
    percentageOfTotalSales: number;
}

export interface SalesByCustomer {
    customerId: number;
    customerName: string;
    transactionCount: number;
    totalSpent: number;
    averageTransactionValue: number;
}

export interface SalesByPaymentMethod {
    paymentMethod: string;
    transactionCount: number;
    totalAmount: number;
    percentageOfTotalSales: number;
}

export interface InventoryItem {
    itemId: number;
    sku: string;
    name: string;
    category: string;
    currentStock: number;
    minStockLevel: number;
    costPrice: number;
    value: number;
}

export interface InventoryMovement {
    itemId: number;
    itemName: string;
    date: string;
    transactionType: string;
    quantityChange: number;
    stockAfter: number;
}

export interface ItemPerformance {
    itemId: number;
    itemName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
    profitMargin: number;
    turnoverRate: number;
}

export interface FinancialSummary {
    period: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
}

export interface AuditActivity {
    logId: number;
    userId: number;
    username: string;
    action: string;
    entityType: string;
    entityId: number;
    timestamp: string;
    details: string;
}

export class Reports {
    constructor() {
        // Initialize the reports module
    }

    /**
     * Generate a report based on the specified type and filter options
     * @param reportType The type of report to generate
     * @param filterOptions Options to filter the report data
     * @returns The report data
     */
    async generateReport(reportType: ReportType, filterOptions: ReportFilterOptions = {}): Promise<any> {
        console.log(`Generating report: ${reportType} with filter options:`, filterOptions);
        
        switch (reportType) {
            case ReportType.SALES_SUMMARY:
                return this.generateSalesSummaryReport(filterOptions);
            case ReportType.SALES_BY_ITEM:
                return this.generateSalesByItemReport(filterOptions);
            case ReportType.SALES_BY_CUSTOMER:
                return this.generateSalesByCustomerReport(filterOptions);
            case ReportType.SALES_BY_PAYMENT_METHOD:
                return this.generateSalesByPaymentMethodReport(filterOptions);
            case ReportType.INVENTORY_CURRENT:
                return this.generateCurrentInventoryReport(filterOptions);
            case ReportType.INVENTORY_LOW_STOCK:
                return this.generateLowStockReport(filterOptions);
            case ReportType.INVENTORY_MOVEMENT:
                return this.generateInventoryMovementReport(filterOptions);
            case ReportType.ITEM_PERFORMANCE:
                return this.generateItemPerformanceReport(filterOptions);
            case ReportType.FINANCIAL_REVENUE:
                return this.generateRevenueReport(filterOptions);
            case ReportType.FINANCIAL_PROFIT:
                return this.generateProfitReport(filterOptions);
            case ReportType.FINANCIAL_COGS:
                return this.generateCOGSReport(filterOptions);
            case ReportType.AUDIT_USER_ACTIVITY:
                return this.generateUserActivityReport(filterOptions);
            case ReportType.AUDIT_SYSTEM_CHANGES:
                return this.generateSystemChangesReport(filterOptions);
            default:
                throw new Error(`Unsupported report type: ${reportType}`);
        }
    }

    /**
     * Generate a sales summary report
     * @param filterOptions Options to filter the report data
     * @returns Sales summary data
     */
    private async generateSalesSummaryReport(filterOptions: ReportFilterOptions): Promise<SalesSummary[]> {
        const { startDate, endDate } = filterOptions;
        
        let query = `
            SELECT 
                TO_CHAR(sale_date::date, 'YYYY-MM-DD') as period,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as average_transaction_value
            FROM sales
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (startDate) {
            query += ` AND sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` GROUP BY period ORDER BY period`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                period: row.period,
                totalSales: parseInt(row.transaction_count),
                totalRevenue: parseFloat(row.total_revenue),
                averageTransactionValue: parseFloat(row.average_transaction_value),
                transactionCount: parseInt(row.transaction_count)
            }));
        } catch (error) {
            console.error('Error generating sales summary report:', error);
            throw error;
        }
    }

    /**
     * Generate a sales by item report
     * @param filterOptions Options to filter the report data
     * @returns Sales by item data
     */
    private async generateSalesByItemReport(filterOptions: ReportFilterOptions): Promise<SalesByItem[]> {
        const { startDate, endDate, category } = filterOptions;
        
        let query = `
            SELECT 
                si.item_id,
                i.name as item_name,
                SUM(si.quantity) as quantity_sold,
                SUM(si.quantity * si.price) as revenue,
                SUM(si.quantity * si.price) / (SELECT SUM(total_amount) FROM sales WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (startDate) {
            query += ` AND sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += `) * 100 as percentage_of_total_sales
            FROM sale_items si
            JOIN items i ON si.item_id = i.id
            JOIN sales s ON si.sale_id = s.id
            WHERE 1=1
        `;
        
        if (startDate) {
            query += ` AND s.sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND s.sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        if (category) {
            query += ` AND i.category = $${paramIndex++}`;
            queryParams.push(category);
        }
        
        query += ` GROUP BY si.item_id, i.name ORDER BY revenue DESC`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                itemId: row.item_id,
                itemName: row.item_name,
                quantitySold: parseInt(row.quantity_sold),
                revenue: parseFloat(row.revenue),
                percentageOfTotalSales: parseFloat(row.percentage_of_total_sales)
            }));
        } catch (error) {
            console.error('Error generating sales by item report:', error);
            throw error;
        }
    }

    /**
     * Generate a sales by customer report
     * @param filterOptions Options to filter the report data
     * @returns Sales by customer data
     */
    private async generateSalesByCustomerReport(filterOptions: ReportFilterOptions): Promise<SalesByCustomer[]> {
        const { startDate, endDate } = filterOptions;
        
        let query = `
            SELECT 
                s.customer_id,
                c.name as customer_name,
                COUNT(*) as transaction_count,
                SUM(s.total_amount) as total_spent,
                AVG(s.total_amount) as average_transaction_value
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            WHERE s.customer_id IS NOT NULL
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (startDate) {
            query += ` AND s.sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND s.sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` GROUP BY s.customer_id, c.name ORDER BY total_spent DESC`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                customerId: row.customer_id,
                customerName: row.customer_name,
                transactionCount: parseInt(row.transaction_count),
                totalSpent: parseFloat(row.total_spent),
                averageTransactionValue: parseFloat(row.average_transaction_value)
            }));
        } catch (error) {
            console.error('Error generating sales by customer report:', error);
            throw error;
        }
    }

    /**
     * Generate a sales by payment method report
     * @param filterOptions Options to filter the report data
     * @returns Sales by payment method data
     */
    private async generateSalesByPaymentMethodReport(filterOptions: ReportFilterOptions): Promise<SalesByPaymentMethod[]> {
        const { startDate, endDate } = filterOptions;
        
        let query = `
            SELECT 
                payment_method,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_amount,
                SUM(total_amount) / (SELECT SUM(total_amount) FROM sales WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (startDate) {
            query += ` AND sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += `) * 100 as percentage_of_total_sales
            FROM sales
            WHERE 1=1
        `;
        
        if (startDate) {
            query += ` AND sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` GROUP BY payment_method ORDER BY total_amount DESC`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                paymentMethod: row.payment_method,
                transactionCount: parseInt(row.transaction_count),
                totalAmount: parseFloat(row.total_amount),
                percentageOfTotalSales: parseFloat(row.percentage_of_total_sales)
            }));
        } catch (error) {
            console.error('Error generating sales by payment method report:', error);
            throw error;
        }
    }

    /**
     * Generate a current inventory report
     * @param filterOptions Options to filter the report data
     * @returns Current inventory data
     */
    private async generateCurrentInventoryReport(filterOptions: ReportFilterOptions): Promise<InventoryItem[]> {
        const { category } = filterOptions;
        
        let query = `
            SELECT 
                id as item_id,
                sku,
                name,
                category,
                stock as current_stock,
                10 as min_stock_level, -- Assuming a default min stock level of 10
                cost_price,
                stock * cost_price as value
            FROM items
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (category) {
            query += ` AND category = $${paramIndex++}`;
            queryParams.push(category);
        }
        
        query += ` ORDER BY category, name`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                itemId: row.item_id,
                sku: row.sku,
                name: row.name,
                category: row.category,
                currentStock: parseInt(row.current_stock),
                minStockLevel: parseInt(row.min_stock_level),
                costPrice: parseFloat(row.cost_price),
                value: parseFloat(row.value)
            }));
        } catch (error) {
            console.error('Error generating current inventory report:', error);
            throw error;
        }
    }

    /**
     * Generate a low stock report
     * @param filterOptions Options to filter the report data
     * @returns Low stock items data
     */
    private async generateLowStockReport(filterOptions: ReportFilterOptions): Promise<InventoryItem[]> {
        const { stockThreshold = 10, category } = filterOptions;
        
        let query = `
            SELECT 
                id as item_id,
                sku,
                name,
                category,
                stock as current_stock,
                ${stockThreshold} as min_stock_level,
                cost_price,
                stock * cost_price as value
            FROM items
            WHERE stock <= $1
        `;
        
        const queryParams: any[] = [stockThreshold];
        let paramIndex = 2;
        
        if (category) {
            query += ` AND category = $${paramIndex++}`;
            queryParams.push(category);
        }
        
        query += ` ORDER BY stock ASC, name`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                itemId: row.item_id,
                sku: row.sku,
                name: row.name,
                category: row.category,
                currentStock: parseInt(row.current_stock),
                minStockLevel: parseInt(row.min_stock_level),
                costPrice: parseFloat(row.cost_price),
                value: parseFloat(row.value)
            }));
        } catch (error) {
            console.error('Error generating low stock report:', error);
            throw error;
        }
    }

    /**
     * Generate an inventory movement report
     * @param filterOptions Options to filter the report data
     * @returns Inventory movement data
     */
    private async generateInventoryMovementReport(filterOptions: ReportFilterOptions): Promise<InventoryMovement[]> {
        const { startDate, endDate, itemId } = filterOptions;
        
        let query = `
            SELECT 
                inv.item_id,
                i.name as item_name,
                inv.transaction_date as date,
                inv.transaction_type,
                inv.quantity_change,
                (
                    SELECT SUM(quantity_change) 
                    FROM inventory 
                    WHERE item_id = inv.item_id AND transaction_date <= inv.transaction_date
                ) as stock_after
            FROM inventory inv
            JOIN items i ON inv.item_id = i.id
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (itemId) {
            query += ` AND inv.item_id = $${paramIndex++}`;
            queryParams.push(itemId);
        }
        
        if (startDate) {
            query += ` AND inv.transaction_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND inv.transaction_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` ORDER BY inv.transaction_date DESC, inv.item_id`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                itemId: row.item_id,
                itemName: row.item_name,
                date: row.date,
                transactionType: row.transaction_type,
                quantityChange: parseInt(row.quantity_change),
                stockAfter: parseInt(row.stock_after)
            }));
        } catch (error) {
            console.error('Error generating inventory movement report:', error);
            throw error;
        }
    }

    /**
     * Generate an item performance report
     * @param filterOptions Options to filter the report data
     * @returns Item performance data
     */
    private async generateItemPerformanceReport(filterOptions: ReportFilterOptions): Promise<ItemPerformance[]> {
        const { startDate, endDate, category } = filterOptions;
        
        let query = `
            SELECT 
                si.item_id,
                i.name as item_name,
                SUM(si.quantity) as quantity_sold,
                SUM(si.quantity * si.price) as revenue,
                SUM(si.quantity * (si.price - i.cost_price)) as profit,
                SUM(si.quantity * (si.price - i.cost_price)) / SUM(si.quantity * si.price) * 100 as profit_margin,
                SUM(si.quantity) / i.stock as turnover_rate
            FROM sale_items si
            JOIN items i ON si.item_id = i.id
            JOIN sales s ON si.sale_id = s.id
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (startDate) {
            query += ` AND s.sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND s.sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        if (category) {
            query += ` AND i.category = $${paramIndex++}`;
            queryParams.push(category);
        }
        
        query += ` GROUP BY si.item_id, i.name, i.stock ORDER BY profit DESC`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                itemId: row.item_id,
                itemName: row.item_name,
                quantitySold: parseInt(row.quantity_sold),
                revenue: parseFloat(row.revenue),
                profit: parseFloat(row.profit),
                profitMargin: parseFloat(row.profit_margin),
                turnoverRate: parseFloat(row.turnover_rate)
            }));
        } catch (error) {
            console.error('Error generating item performance report:', error);
            throw error;
        }
    }

    /**
     * Generate a revenue report
     * @param filterOptions Options to filter the report data
     * @returns Revenue data
     */
    private async generateRevenueReport(filterOptions: ReportFilterOptions): Promise<FinancialSummary[]> {
        const { startDate, endDate } = filterOptions;
        
        let query = `
            SELECT 
                TO_CHAR(sale_date::date, 'YYYY-MM-DD') as period,
                SUM(total_amount) as revenue,
                SUM(
                    (
                        SELECT SUM(si.quantity * i.cost_price)
                        FROM sale_items si
                        JOIN items i ON si.item_id = i.id
                        WHERE si.sale_id = s.id
                    )
                ) as cost_of_goods_sold,
                SUM(total_amount) - SUM(
                    (
                        SELECT SUM(si.quantity * i.cost_price)
                        FROM sale_items si
                        JOIN items i ON si.item_id = i.id
                        WHERE si.sale_id = s.id
                    )
                ) as gross_profit,
                (SUM(total_amount) - SUM(
                    (
                        SELECT SUM(si.quantity * i.cost_price)
                        FROM sale_items si
                        JOIN items i ON si.item_id = i.id
                        WHERE si.sale_id = s.id
                    )
                )) / SUM(total_amount) * 100 as gross_profit_margin
            FROM sales s
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (startDate) {
            query += ` AND sale_date >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND sale_date <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` GROUP BY period ORDER BY period`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                period: row.period,
                revenue: parseFloat(row.revenue),
                costOfGoodsSold: parseFloat(row.cost_of_goods_sold),
                grossProfit: parseFloat(row.gross_profit),
                grossProfitMargin: parseFloat(row.gross_profit_margin)
            }));
        } catch (error) {
            console.error('Error generating revenue report:', error);
            throw error;
        }
    }

    /**
     * Generate a profit report
     * @param filterOptions Options to filter the report data
     * @returns Profit data
     */
    private async generateProfitReport(filterOptions: ReportFilterOptions): Promise<FinancialSummary[]> {
        // This is essentially the same as the revenue report but with a focus on profit
        return this.generateRevenueReport(filterOptions);
    }

    /**
     * Generate a cost of goods sold report
     * @param filterOptions Options to filter the report data
     * @returns COGS data
     */
    private async generateCOGSReport(filterOptions: ReportFilterOptions): Promise<FinancialSummary[]> {
        // This is essentially the same as the revenue report but with a focus on COGS
        return this.generateRevenueReport(filterOptions);
    }

    /**
     * Generate a user activity report
     * @param filterOptions Options to filter the report data
     * @returns User activity data
     */
    private async generateUserActivityReport(filterOptions: ReportFilterOptions): Promise<AuditActivity[]> {
        const { startDate, endDate, userId } = filterOptions;
        
        let query = `
            SELECT 
                a.log_id,
                a.user_id,
                u.username,
                a.action,
                a.entity_type,
                a.entity_id,
                a.timestamp,
                a.details
            FROM audit_trail a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (userId) {
            query += ` AND a.user_id = $${paramIndex++}`;
            queryParams.push(userId);
        }
        
        if (startDate) {
            query += ` AND a.timestamp >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND a.timestamp <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` ORDER BY a.timestamp DESC`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                logId: row.log_id,
                userId: row.user_id,
                username: row.username,
                action: row.action,
                entityType: row.entity_type,
                entityId: row.entity_id,
                timestamp: row.timestamp,
                details: row.details
            }));
        } catch (error) {
            console.error('Error generating user activity report:', error);
            throw error;
        }
    }

    /**
     * Generate a system changes report
     * @param filterOptions Options to filter the report data
     * @returns System changes data
     */
    private async generateSystemChangesReport(filterOptions: ReportFilterOptions): Promise<AuditActivity[]> {
        const { startDate, endDate, entityType } = filterOptions;
        
        let query = `
            SELECT 
                a.log_id,
                a.user_id,
                u.username,
                a.action,
                a.entity_type,
                a.entity_id,
                a.timestamp,
                a.details
            FROM audit_trail a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        if (entityType) {
            query += ` AND a.entity_type = $${paramIndex++}`;
            queryParams.push(entityType);
        }
        
        if (startDate) {
            query += ` AND a.timestamp >= $${paramIndex++}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND a.timestamp <= $${paramIndex++}`;
            queryParams.push(endDate);
        }
        
        query += ` ORDER BY a.timestamp DESC`;
        
        try {
            const result = await db.query(query, queryParams);
            
            return result.rows.map((row: any) => ({
                logId: row.log_id,
                userId: row.user_id,
                username: row.username,
                action: row.action,
                entityType: row.entity_type,
                entityId: row.entity_id,
                timestamp: row.timestamp,
                details: row.details
            }));
        } catch (error) {
            console.error('Error generating system changes report:', error);
            throw error;
        }
    }
}
