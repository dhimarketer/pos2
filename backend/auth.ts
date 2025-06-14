// backend/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Role } from './permissions';
import { createUser } from './user';
import { DatabaseError, AuthenticationError, ValidationError } from './error-handler';
import { db } from './database';

// User registration function
export async function registerUser(username: string, password: string, role: string): Promise<{ token: string }> {
  console.log('Registering user');

  // Validate username
  if (!username || username.trim() === '') {
    throw new ValidationError('Username is required');
  }
  if (username.length < 3 || username.length > 20) {
    throw new ValidationError('Username must be between 3 and 20 characters');
  }

  // Validate password
  if (!password || password.trim() === '') {
    throw new ValidationError('Password is required');
  }
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await createUser(username, hashedPassword, role as Role);
  // Generate JWT token for the new user
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { token };
}

// Placeholder function for user login
export async function loginUser(username: string, password: string): Promise<{ token: string } | undefined> {
  console.log('Logging in user');

  // Validate username
  if (!username || username.trim() === '') {
    throw new ValidationError('Username is required');
  }

  // Validate password
  if (!password || password.trim() === '') {
    throw new ValidationError('Password is required');
  }

  // Implement user login logic here
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Passwords match, generate JWT
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { token };
}

// Function to check if token is about to expire
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return false;
    
    // Check if token will expire in the next 5 minutes (300 seconds)
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    return timeUntilExpiry > 0 && timeUntilExpiry < 300000; // Less than 5 minutes
  } catch (err) {
    return false;
  }
}

// Middleware to verify JWT
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // if there isn't any token
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403); // if token is not valid
    }
    
    // Check if token is about to expire and add a warning header
    if (isTokenExpiringSoon(token)) {
      res.set('X-Session-Expiring-Soon', 'true');
    }
    
    req.user = user;
    next();
  });
}
