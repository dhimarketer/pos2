import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateCustomer = [
    body('name').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 50 }).withMessage('Customer name cannot exceed 50 characters'),
    body('email').trim().isEmail().withMessage('Invalid email format').optional({ nullable: true }),
    body('phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Invalid phone number format'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
