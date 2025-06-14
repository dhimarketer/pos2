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
