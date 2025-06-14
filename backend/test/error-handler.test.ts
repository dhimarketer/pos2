import request from 'supertest';
import { errorHandler } from '../error-handler';
import express from 'express';

describe('Error Handler', () => {
  const app = express();

  beforeAll(() => {
    // Test route that throws different types of errors
    app.get('/test/:errorType', (req, res, next) => {
      const { errorType } = req.params;
      
      switch(errorType) {
        case 'validation':
          throw new Error('Validation error');
        case 'database':
          throw new Error('Database error');
        case 'auth':
          throw new Error('Authentication error');
        default:
          throw new Error('Unknown error');
      }
    });

    app.use(errorHandler);
  });

  it('should handle validation errors with 400 status', async () => {
    const response = await request(app)
      .get('/test/validation');
    
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });

  it('should handle database errors with 500 status', async () => {
    const response = await request(app)
      .get('/test/database');
    
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Database error');
  });

  it('should handle authentication errors with 401 status', async () => {
    const response = await request(app)
      .get('/test/auth');
    
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication error');
  });

  it('should include stack trace in development', async () => {
    process.env.NODE_ENV = 'development';
    const response = await request(app)
      .get('/test/unknown');
    
    expect(response.status).toBe(500);
    expect(response.body.stack).toBeDefined();
    process.env.NODE_ENV = 'test';
  });
});
