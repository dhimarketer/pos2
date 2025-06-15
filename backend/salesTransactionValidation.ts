import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateSalesTransaction = [
    body('customerId').notEmpty().withMessage('Customer ID is required').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
    body('transactionDate').notEmpty().withMessage('Transaction date is required').isISO8601().withMessage('Invalid transaction date format'),
    body('items').notEmpty().withMessage('Items are required').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('items.*.quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('totalAmount').notEmpty().withMessage('Total amount is required').isFloat({ min: 0.01 }).withMessage('Total amount must be a positive number'),
    body('paymentMethod').trim().notEmpty().withMessage('Payment method is required').isIn(['cash', 'credit', 'debit']).withMessage('Invalid payment method'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
