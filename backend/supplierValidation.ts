import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateSupplier = [
    body('name').trim().notEmpty().withMessage('Supplier name is required').isLength({ max: 50 }).withMessage('Supplier name cannot exceed 50 characters'),
    body('email').trim().isEmail().withMessage('Invalid email format').optional({ nullable: true }),
    body('phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Invalid phone number format'),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 100 }).withMessage('Address cannot exceed 100 characters'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
