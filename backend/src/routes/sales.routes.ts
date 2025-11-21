import { Router } from 'express';
import * as salesController from '../controllers/sales.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// All authenticated users can create and view sales
router.post('/', salesController.createSale);
router.get('/', salesController.getAllSales);
router.get('/weekly', salesController.getWeeklySales);
router.get('/top-products', salesController.getTopProducts);

// ✅ ADD THIS LINE:
router.get('/summary/today', salesController.getTodaySalesSummary);

router.get('/:id', salesController.getSaleById);

// Only Admin can delete sales
router.delete('/:id',
  authorizeRoles(['Admin']),
  salesController.deleteSale
);

export default router;
