import { Request, Response } from 'express';
import pool from '../config/database';
import { generateUUID } from '../utils/helpers';
import { RowDataPacket } from 'mysql2';

// Get all products
export async function getAllProducts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const [products] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Products WHERE IsActive = TRUE ORDER BY ProductName'
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get product by ID
export async function getProductById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const [products] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Products WHERE ProductId = ? AND IsActive = TRUE',
      [id]
    );

    if (products.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Create new product
export async function createProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { productName, batchNo, expiryDate, composition, mrp, stockQty } =
      req.body;

    // Validate required fields
    if (!productName || !batchNo || !expiryDate || !mrp) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }

    const productId = generateUUID();

    await pool.query(
      'INSERT INTO Products (ProductId, ProductName, BatchNo, ExpiryDate, Composition, MRP, StockQty) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        productId,
        productName,
        batchNo,
        expiryDate,
        composition || null,
        mrp,
        stockQty || 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { productId }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Update product
export async function updateProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { productName, batchNo, expiryDate, composition, mrp, stockQty } =
      req.body;

    const [result]: any = await pool.query(
      'UPDATE Products SET ProductName = ?, BatchNo = ?, ExpiryDate = ?, Composition = ?, MRP = ?, StockQty = ? WHERE ProductId = ?',
      [productName, batchNo, expiryDate, composition, mrp, stockQty, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Delete product (soft delete)
export async function deleteProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const [result]: any = await pool.query(
      'UPDATE Products SET IsActive = FALSE WHERE ProductId = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
