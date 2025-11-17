import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (require authentication)
router.get('/', authenticate, getAllProducts);
router.get('/:id', authenticate, getProductById);

// Protected routes (Admin/Manager only)
router.post('/', authenticate, authorize('Admin', 'Manager'), createProduct);
router.put('/:id', authenticate, authorize('Admin', 'Manager'), updateProduct);
router.delete(
  '/:id',
  authenticate,
  authorize('Admin', 'Manager'),
  deleteProduct
);

export default router;
