import { Request, Response } from 'express';
import pool from '../config/database';
import { generateUUID } from '../utils/helpers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Create sale with transaction
export async function createSale(req: Request, res: Response): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    const { customerId, paymentType, items } = req.body;
    const createdBy = req.user?.email || 'system';

    // Validation
    if (!customerId || !paymentType || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }

    await connection.beginTransaction();

    // Check stock availability for all items
    for (const item of items) {
      const [products] = await connection.query<RowDataPacket[]>(
        'SELECT ProductId, ProductName, StockQty FROM Products WHERE ProductId = ? AND IsActive = TRUE',
        [item.productId]
      );

      if (products.length === 0) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
        return;
      }

      const product = products[0];
      if (product.StockQty < item.quantity) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.ProductName}. Available: ${product.StockQty}, Required: ${item.quantity}`
        });
        return;
      }
    }

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0);

    // Create sales header
    const salesId = generateUUID();
    await connection.query(
      'INSERT INTO SalesHeader (SalesId, CustomerId, PaymentType, TotalAmount, CreatedBy) VALUES (?, ?, ?, ?, ?)',
      [salesId, customerId, paymentType, totalAmount, createdBy]
    );

    // Create sales lines and deduct stock
    for (const item of items) {
      const salesLineId = generateUUID();
      const lineTotal = item.quantity * item.rate;

      // Insert sales line
      await connection.query(
        'INSERT INTO SalesLine (SalesLineId, SalesId, ProductId, Quantity, Rate, LineTotal) VALUES (?, ?, ?, ?, ?, ?)',
        [salesLineId, salesId, item.productId, item.quantity, item.rate, lineTotal]
      );

      // Deduct stock
      await connection.query(
        'UPDATE Products SET StockQty = StockQty - ? WHERE ProductId = ?',
        [item.quantity, item.productId]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { salesId, totalAmount }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    connection.release();
  }
}

// Get all sales
export async function getAllSales(req: Request, res: Response): Promise<void> {
  try {
    const [sales] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sh.SalesId,
        sh.SalesDate,
        sh.TotalAmount,
        sh.PaymentType,
        c.CustomerName,
        c.Mobile
      FROM SalesHeader sh
      JOIN Customers c ON sh.CustomerId = c.CustomerId
      ORDER BY sh.SalesDate DESC`
    );

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get weekly sales data
export async function getWeeklySales(req: Request, res: Response): Promise<void> {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT 
        DAYNAME(SalesDate) as dayName,
        DATE(SalesDate) as saleDate,
        COALESCE(SUM(TotalAmount), 0) as totalSales
      FROM SalesHeader 
      WHERE SalesDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(SalesDate), DAYNAME(SalesDate)
      ORDER BY saleDate ASC`
    );

    // Fill in missing days with 0
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const salesMap = new Map(result.map(r => [r.dayName, r.totalSales]));
    
    const weeklySales = daysOfWeek.map(day => ({
      day: day.substring(0, 3), // Mon, Tue, etc.
      sales: salesMap.get(day) || 0
    }));

    res.json({
      success: true,
      data: weeklySales
    });
  } catch (error) {
    console.error('Get weekly sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get top selling products
export async function getTopProducts(req: Request, res: Response): Promise<void> {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.ProductName,
        SUM(sl.Quantity) as totalQuantity,
        SUM(sl.LineTotal) as totalRevenue
      FROM SalesLine sl
      JOIN Products p ON sl.ProductId = p.ProductId
      GROUP BY p.ProductId, p.ProductName
      ORDER BY totalQuantity DESC
      LIMIT 5`
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}


// Get sale details by ID
export async function getSaleById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Get header
    const [headers] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sh.*,
        c.CustomerName,
        c.Mobile,
        c.Email
      FROM SalesHeader sh
      JOIN Customers c ON sh.CustomerId = c.CustomerId
      WHERE sh.SalesId = ?`,
      [id]
    );

    if (headers.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
      return;
    }

    // Get lines
    const [lines] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sl.*,
        p.ProductName,
        p.BatchNo
      FROM SalesLine sl
      JOIN Products p ON sl.ProductId = p.ProductId
      WHERE sl.SalesId = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        header: headers[0],
        lines: lines
      }
    });

  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get today's sales summary
export async function getTodaySalesSummary(req: Request, res: Response): Promise<void> {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(TotalAmount), 0) as totalSales,
        COUNT(*) as transactionCount
      FROM SalesHeader 
      WHERE DATE(SalesDate) = CURDATE()`
    );

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get today sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
