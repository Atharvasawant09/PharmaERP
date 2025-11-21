import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - All authenticated users can view
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// POST - Only Admin and Manager can create products
router.post('/', 
  authorizeRoles(['Admin', 'Manager']),
  productController.createProduct
);

// PUT - Only Admin and Manager can update products
router.put('/:id', 
  authorizeRoles(['Admin', 'Manager']),
  productController.updateProduct
);

// DELETE - Only Admin can delete products
router.delete('/:id', 
  authorizeRoles(['Admin']),
  productController.deleteProduct
);

export default router;
