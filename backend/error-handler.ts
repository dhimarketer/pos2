// backend/error-handler.ts

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export class ValidationError extends Error {
  public statusCode: number = 400;
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Custom error classes
export class DatabaseError extends Error {
  public statusCode: number = 500;
  constructor(message: string, public query?: string, public params?: any[]) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  public statusCode: number = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  public statusCode: number = 403;
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  public statusCode: number = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

interface ErrorResponse {
  status: number;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
  stack?: string;
}

const LOG_DIR = path.join(__dirname, '../logs');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'errors.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logErrorToFile(error: Error, req: Request, details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      body: req.body
    },
    details
  };

  fs.appendFileSync(ERROR_LOG_FILE, JSON.stringify(logEntry) + '\n');

  // Placeholder for sending error logs to an external service
  // sendErrorToExternalService(logEntry);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let errorResponse: ErrorResponse = {
    status: 500,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Handle different error types
  if (err instanceof ValidationError) {
    errorResponse = {
      status: err.statusCode,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  } else if (err instanceof DatabaseError) {
    errorResponse = {
      status: err.statusCode,
      message: err.message,
      details: {
        query: err.query,
        params: err.params
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  } else if (err instanceof AuthenticationError || err instanceof AuthorizationError || err instanceof NotFoundError) {
    errorResponse = {
      status: err.statusCode,
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Log the error
  logErrorToFile(err, req, errorResponse.details);
  console.error(JSON.stringify({
    level: 'error',
    ...errorResponse,
    error: err.stack
  }, null, 2));

  // Send error response
  res.status(errorResponse.status).json(errorResponse);
}

// Middleware to handle 404 Not Found
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new NotFoundError('Resource not found');
  logErrorToFile(error, req);
  res.status(404).json({
    status: 404,
    message: 'Resource not found',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
}

// Middleware to handle async errors
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Log the error before passing it to the error handler
      logErrorToFile(err, req);
      next(err);
    });
  };
}
