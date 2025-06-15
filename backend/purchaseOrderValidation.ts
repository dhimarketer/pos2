import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validatePurchaseOrder = [
    body('supplierId').notEmpty().withMessage('Supplier ID is required').isInt({ min: 1 }).withMessage('Supplier ID must be a positive integer'),
    body('orderDate').notEmpty().withMessage('Order date is required').isISO8601().withMessage('Invalid order date format'),
    body('items').notEmpty().withMessage('Items are required').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('items.*.quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('totalAmount').notEmpty().withMessage('Total amount is required').isFloat({ min: 0.01 }).withMessage('Total amount must be a positive number'),
    body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required').isLength({ max: 100 }).withMessage('Shipping address cannot exceed 100 characters'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
