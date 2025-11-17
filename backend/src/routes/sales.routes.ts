import { Router } from 'express';
import { 
  createSale, 
  getAllSales, 
  getSaleById,
  getTodaySalesSummary,
  getWeeklySales,      // ADD THIS
  getTopProducts        // ADD THIS
} from '../controllers/sales.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// POST routes
router.post('/', authenticate, authorize('Admin', 'SalesAgent', 'Manager'), createSale);

// GET routes - SPECIFIC FIRST, THEN DYNAMIC
router.get('/summary/today', authenticate, getTodaySalesSummary);
router.get('/weekly', authenticate, getWeeklySales);           // ADD THIS
router.get('/top-products', authenticate, getTopProducts);    // ADD THIS
router.get('/', authenticate, getAllSales);
router.get('/:id', authenticate, getSaleById);

export default router;
