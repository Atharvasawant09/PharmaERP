import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// All authenticated users can view and create customers
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);

// Only Admin and Manager can update customers
router.put('/:id',
  authorizeRoles(['Admin', 'Manager']),
  customerController.updateCustomer
);

// Only Admin can delete customers
router.delete('/:id',
  authorizeRoles(['Admin']),
  customerController.deleteCustomer
);

export default router;
