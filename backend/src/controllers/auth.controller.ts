import { Request, Response } from 'express';
import pool from '../config/database';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { generateUUID } from '../utils/helpers';
import { LoginRequest } from '../models/User';
import { RowDataPacket } from 'mysql2';

// Register new user
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName, role } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Check if user exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT UserId FROM Users WHERE Email = ?',
      [email]
    );

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: 'User already exists'
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateUUID();

    // Insert user
    await pool.query(
      'INSERT INTO Users (UserId, Email, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, passwordHash, fullName || null, role || 'SalesAgent']
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId, email, fullName, role: role || 'SalesAgent' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Login user
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Find user
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT UserId, Email, PasswordHash, FullName, Role, IsActive FROM Users WHERE Email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    const user = users[0];

    // Check if active
    if (!user.IsActive) {
      res.status(403).json({
        success: false,
        message: 'Account is disabled'
      });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.PasswordHash);

    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.UserId,
      email: user.Email,
      role: user.Role
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.UserId,
          email: user.Email,
          fullName: user.FullName,
          role: user.Role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get current user profile
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT UserId, Email, FullName, Role, CreatedAt FROM Users WHERE UserId = ?',
      [userId]
    );

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
