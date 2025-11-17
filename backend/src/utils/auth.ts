import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../models/User';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  
  return jwt.sign(payload, secret, { expiresIn: expiresIn });
}

// Verify JWT token
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.verify(token, secret) as JwtPayload;
}
