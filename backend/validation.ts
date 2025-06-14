// backend/validation.ts

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Custom error class for validation errors
export class ValidationError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details: any) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

// Middleware to validate request data against a schema
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
      }));
      next(new ValidationError('Validation error', details));
    } else {
      req.body = value;
      next();
    }
  };
}

// Validation schemas for different entities

// User validation schemas
export const userSchemas = {
  create: Joi.object({
    username: Joi.string().min(3).max(30).required()
      .messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username cannot be empty',
        'string.min': 'Username must be at least {#limit} characters long',
        'string.max': 'Username cannot be more than {#limit} characters long',
        'any.required': 'Username is required',
      }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
      .messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password must be at least {#limit} characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    role: Joi.string().valid('Manager', 'Cashier').required()
      .messages({
        'string.base': 'Role must be a string',
        'string.empty': 'Role cannot be empty',
        'any.only': 'Role must be either "Manager" or "Cashier"',
        'any.required': 'Role is required',
      }),
  }),
  update: Joi.object({
    username: Joi.string().min(3).max(30)
      .messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username cannot be empty',
        'string.min': 'Username must be at least {#limit} characters long',
        'string.max': 'Username cannot be more than {#limit} characters long',
      }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password must be at least {#limit} characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }),
    role: Joi.string().valid('Manager', 'Cashier')
      .messages({
        'string.base': 'Role must be a string',
        'string.empty': 'Role cannot be empty',
        'any.only': 'Role must be either "Manager" or "Cashier"',
      }),
  }),
  login: Joi.object({
    username: Joi.string().required()
      .messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username cannot be empty',
        'any.required': 'Username is required',
      }),
    password: Joi.string().required()
      .messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password cannot be empty',
        'any.required': 'Password is required',
      }),
  }),
};

// Item validation schemas
export const itemSchemas = {
  create: Joi.object({
    sku: Joi.string().required()
      .messages({
        'string.base': 'SKU must be a string',
        'string.empty': 'SKU cannot be empty',
        'any.required': 'SKU is required',
      }),
    name: Joi.string().required()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'any.required': 'Name is required',
      }),
    description: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Description must be a string',
      }),
    category: Joi.string().required()
      .messages({
        'string.base': 'Category must be a string',
        'string.empty': 'Category cannot be empty',
        'any.required': 'Category is required',
      }),
    costPrice: Joi.number().positive().required()
      .messages({
        'number.base': 'Cost price must be a number',
        'number.positive': 'Cost price must be a positive number',
        'any.required': 'Cost price is required',
      }),
    packagingUnit: Joi.string().required()
      .messages({
        'string.base': 'Packaging unit must be a string',
        'string.empty': 'Packaging unit cannot be empty',
        'any.required': 'Packaging unit is required',
      }),
    stockLevel: Joi.number().integer().min(0).required()
      .messages({
        'number.base': 'Stock level must be a number',
        'number.integer': 'Stock level must be an integer',
        'number.min': 'Stock level cannot be negative',
        'any.required': 'Stock level is required',
      }),
    multiLevelPricing: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Multi-level pricing must be a string',
      }),
    status: Joi.string().valid('active', 'inactive').required()
      .messages({
        'string.base': 'Status must be a string',
        'string.empty': 'Status cannot be empty',
        'any.only': 'Status must be either "active" or "inactive"',
        'any.required': 'Status is required',
      }),
  }),
  update: Joi.object({
    sku: Joi.string()
      .messages({
        'string.base': 'SKU must be a string',
        'string.empty': 'SKU cannot be empty',
      }),
    name: Joi.string()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
      }),
    description: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Description must be a string',
      }),
    category: Joi.string()
      .messages({
        'string.base': 'Category must be a string',
        'string.empty': 'Category cannot be empty',
      }),
    costPrice: Joi.number().positive()
      .messages({
        'number.base': 'Cost price must be a number',
        'number.positive': 'Cost price must be a positive number',
      }),
    packagingUnit: Joi.string()
      .messages({
        'string.base': 'Packaging unit must be a string',
        'string.empty': 'Packaging unit cannot be empty',
      }),
    stock: Joi.number().integer().min(0)
      .messages({
        'number.base': 'Stock must be a number',
        'number.integer': 'Stock must be an integer',
        'number.min': 'Stock cannot be negative',
      }),
    multiLevelPricing: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Multi-level pricing must be a string',
      }),
    status: Joi.string().valid('active', 'inactive')
      .messages({
        'string.base': 'Status must be a string',
        'string.empty': 'Status cannot be empty',
        'any.only': 'Status must be either "active" or "inactive"',
      }),
  }),
  adjustStock: Joi.object({
    quantity: Joi.number().integer().required()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'any.required': 'Quantity is required',
      }),
  }),
};

// Customer validation schemas
export const customerSchemas = {
  create: Joi.object({
    name: Joi.string().required()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'any.required': 'Name is required',
      }),
    contactInfo: Joi.string().required()
      .messages({
        'string.base': 'Contact info must be a string',
        'string.empty': 'Contact info cannot be empty',
        'any.required': 'Contact info is required',
      }),
    address: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Address must be a string',
      }),
    purchaseHistory: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Purchase history must be a string',
      }),
  }),
  update: Joi.object({
    name: Joi.string()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
      }),
    contactInfo: Joi.string()
      .messages({
        'string.base': 'Contact info must be a string',
        'string.empty': 'Contact info cannot be empty',
      }),
    address: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Address must be a string',
      }),
    purchaseHistory: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Purchase history must be a string',
      }),
  }),
};

// Supplier validation schemas
export const supplierSchemas = {
  create: Joi.object({
    companyName: Joi.string().required()
      .messages({
        'string.base': 'Company name must be a string',
        'string.empty': 'Company name cannot be empty',
        'any.required': 'Company name is required',
      }),
    contactPerson: Joi.string().required()
      .messages({
        'string.base': 'Contact person must be a string',
        'string.empty': 'Contact person cannot be empty',
        'any.required': 'Contact person is required',
      }),
    phone: Joi.string().required()
      .messages({
        'string.base': 'Phone must be a string',
        'string.empty': 'Phone cannot be empty',
        'any.required': 'Phone is required',
      }),
    email: Joi.string().email().required()
      .messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
      }),
    address: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Address must be a string',
      }),
    paymentTerms: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Payment terms must be a string',
      }),
  }),
  update: Joi.object({
    companyName: Joi.string()
      .messages({
        'string.base': 'Company name must be a string',
        'string.empty': 'Company name cannot be empty',
      }),
    contactPerson: Joi.string()
      .messages({
        'string.base': 'Contact person must be a string',
        'string.empty': 'Contact person cannot be empty',
      }),
    phone: Joi.string()
      .messages({
        'string.base': 'Phone must be a string',
        'string.empty': 'Phone cannot be empty',
      }),
    email: Joi.string().email()
      .messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email address',
      }),
    address: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Address must be a string',
      }),
    paymentTerms: Joi.string().allow('').optional()
      .messages({
        'string.base': 'Payment terms must be a string',
      }),
  }),
};

// Purchase order validation schemas
export const purchaseOrderSchemas = {
  create: Joi.object({
    supplierId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Supplier ID must be a number',
        'number.integer': 'Supplier ID must be an integer',
        'number.positive': 'Supplier ID must be a positive number',
        'any.required': 'Supplier ID is required',
      }),
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'Item ID must be a number',
            'number.integer': 'Item ID must be an integer',
            'number.positive': 'Item ID must be a positive number',
            'any.required': 'Item ID is required',
          }),
        quantity: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.positive': 'Quantity must be a positive number',
            'any.required': 'Quantity is required',
          }),
        costPrice: Joi.number().positive().required()
          .messages({
            'number.base': 'Cost price must be a number',
            'number.positive': 'Cost price must be a positive number',
            'any.required': 'Cost price is required',
          }),
      })
    ).min(1).required()
      .messages({
        'array.base': 'Items must be an array',
        'array.min': 'At least one item is required',
        'any.required': 'Items are required',
      }),
  }),
  update: Joi.object({
    supplierId: Joi.number().integer().positive()
      .messages({
        'number.base': 'Supplier ID must be a number',
        'number.integer': 'Supplier ID must be an integer',
        'number.positive': 'Supplier ID must be a positive number',
      }),
    itemId: Joi.number().integer().positive()
      .messages({
        'number.base': 'Item ID must be a number',
        'number.integer': 'Item ID must be an integer',
        'number.positive': 'Item ID must be a positive number',
      }),
    quantity: Joi.number().integer().positive()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.positive': 'Quantity must be a positive number',
      }),
    cost: Joi.number().positive()
      .messages({
        'number.base': 'Cost must be a number',
        'number.positive': 'Cost must be a positive number',
      }),
    orderDate: Joi.string()
      .messages({
        'string.base': 'Order date must be a string',
        'string.empty': 'Order date cannot be empty',
      }),
  }),
};

// Sales transaction validation schemas
export const salesTransactionSchemas = {
  create: Joi.object({
    customerId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Customer ID must be a number',
        'number.integer': 'Customer ID must be an integer',
        'number.positive': 'Customer ID must be a positive number',
        'any.required': 'Customer ID is required',
      }),
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'Item ID must be a number',
            'number.integer': 'Item ID must be an integer',
            'number.positive': 'Item ID must be a positive number',
            'any.required': 'Item ID is required',
          }),
        quantity: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.positive': 'Quantity must be a positive number',
            'any.required': 'Quantity is required',
          }),
        price: Joi.number().positive().required()
          .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be a positive number',
            'any.required': 'Price is required',
          }),
      })
    ).min(1).required()
      .messages({
        'array.base': 'Items must be an array',
        'array.min': 'At least one item is required',
        'any.required': 'Items are required',
      }),
    paymentType: Joi.string().valid('cash', 'credit', 'debit', 'mobile').required()
      .messages({
        'string.base': 'Payment type must be a string',
        'string.empty': 'Payment type cannot be empty',
        'any.only': 'Payment type must be one of: cash, credit, debit, mobile',
        'any.required': 'Payment type is required',
      }),
    saleDate: Joi.string().optional()
      .messages({
        'string.base': 'Sale date must be a string',
      }),
  }),
  update: Joi.object({
    customerId: Joi.number().integer().positive()
      .messages({
        'number.base': 'Customer ID must be a number',
        'number.integer': 'Customer ID must be an integer',
        'number.positive': 'Customer ID must be a positive number',
      }),
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'Item ID must be a number',
            'number.integer': 'Item ID must be an integer',
            'number.positive': 'Item ID must be a positive number',
            'any.required': 'Item ID is required',
          }),
        quantity: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.positive': 'Quantity must be a positive number',
            'any.required': 'Quantity is required',
          }),
        price: Joi.number().positive().required()
          .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be a positive number',
            'any.required': 'Price is required',
          }),
      })
    ).min(1)
      .messages({
        'array.base': 'Items must be an array',
        'array.min': 'At least one item is required',
      }),
    paymentType: Joi.string().valid('cash', 'credit', 'debit', 'mobile')
      .messages({
        'string.base': 'Payment type must be a string',
        'string.empty': 'Payment type cannot be empty',
        'any.only': 'Payment type must be one of: cash, credit, debit, mobile',
      }),
    saleDate: Joi.string()
      .messages({
        'string.base': 'Sale date must be a string',
      }),
  }),
};

// Report validation schemas
export const reportSchemas = {
  generate: Joi.object({
    startDate: Joi.string().optional()
      .messages({
        'string.base': 'Start date must be a string',
      }),
    endDate: Joi.string().optional()
      .messages({
        'string.base': 'End date must be a string',
      }),
    itemId: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Item ID must be a number',
        'number.integer': 'Item ID must be an integer',
        'number.positive': 'Item ID must be a positive number',
      }),
    customerId: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Customer ID must be a number',
        'number.integer': 'Customer ID must be an integer',
        'number.positive': 'Customer ID must be a positive number',
      }),
    userId: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be a positive number',
      }),
    stockThreshold: Joi.number().integer().min(0).optional()
      .messages({
        'number.base': 'Stock threshold must be a number',
        'number.integer': 'Stock threshold must be an integer',
        'number.min': 'Stock threshold cannot be negative',
      }),
    limit: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.positive': 'Limit must be a positive number',
      }),
    page: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.positive': 'Page must be a positive number',
      }),
  }),
};

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().positive().default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.positive': 'Page must be a positive number',
    }),
  pageSize: Joi.number().integer().positive().max(100).default(20)
    .messages({
      'number.base': 'Page size must be a number',
      'number.integer': 'Page size must be an integer',
      'number.positive': 'Page size must be a positive number',
      'number.max': 'Page size cannot be more than {#limit}',
    }),
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be a positive number',
      'any.required': 'ID is required',
    }),
});

// Middleware to validate ID parameter
export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const { error } = idParamSchema.validate({ id: parseInt(req.params.id) });
  if (error) {
    next(new ValidationError('Invalid ID parameter', error.details));
  } else {
    next();
  }
}

// Middleware to validate query parameters for pagination
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const { error, value } = paginationSchema.validate({
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
  });

  if (error) {
    next(new ValidationError('Invalid pagination parameters', error.details));
  } else {
    req.query.page = value.page.toString();
    req.query.pageSize = value.pageSize.toString();
    next();
  }
}
