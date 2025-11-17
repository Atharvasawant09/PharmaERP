import { Request, Response } from 'express';
import pool from '../config/database';
import { generateUUID } from '../utils/helpers';
import { RowDataPacket } from 'mysql2';

// Get all customers
export async function getAllCustomers(req: Request, res: Response): Promise<void> {
  try {
    const [customers] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Customers ORDER BY CustomerName'
    );

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Create customer
export async function createCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { customerName, mobile, email } = req.body;

    if (!customerName) {
      res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
      return;
    }

    const customerId = generateUUID();

    await pool.query(
      'INSERT INTO Customers (CustomerId, CustomerName, Mobile, Email) VALUES (?, ?, ?, ?)',
      [customerId, customerName, mobile || null, email || null]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customerId }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
