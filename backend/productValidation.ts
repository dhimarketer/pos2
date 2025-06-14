import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateProduct = [
    body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 50 }).withMessage('Product name cannot exceed 50 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
    body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
