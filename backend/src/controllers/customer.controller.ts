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

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const [customers] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Customers WHERE CustomerId = ?',
      [id]
    );

    if (customers.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: customers[0]
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer'
    });
  }
}

/**
 * Update customer
 */
export async function updateCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { customerName, mobile, email } = req.body;

    // Validate input
    if (!customerName) {
      res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
      return;
    }

    // Check if customer exists
    const [existingCustomers] = await pool.query<RowDataPacket[]>(
      'SELECT CustomerId FROM Customers WHERE CustomerId = ?',
      [id]
    );

    if (existingCustomers.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    // Check for duplicate email (if email is being changed)
    if (email) {
      const [duplicateEmail] = await pool.query<RowDataPacket[]>(
        'SELECT CustomerId FROM Customers WHERE Email = ? AND CustomerId != ?',
        [email, id]
      );

      if (duplicateEmail.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Email already exists for another customer'
        });
        return;
      }
    }

    // Update customer
    await pool.query(
      `UPDATE Customers 
       SET CustomerName = ?, Mobile = ?, Email = ? 
       WHERE CustomerId = ?`,
      [customerName, mobile || null, email || null, id]
    );

    res.json({
      success: true,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer'
    });
  }
}

/**
 * Delete customer
 */
export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if customer exists
    const [existingCustomers] = await pool.query<RowDataPacket[]>(
      'SELECT CustomerId FROM Customers WHERE CustomerId = ?',
      [id]
    );

    if (existingCustomers.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    // Check if customer has any sales
    const [salesCheck] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM SalesHeader WHERE CustomerId = ?',
      [id]
    );

    if (salesCheck[0].count > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing sales records'
      });
      return;
    }

    // Delete customer
    await pool.query(
      'DELETE FROM Customers WHERE CustomerId = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer'
    });
  }
}

