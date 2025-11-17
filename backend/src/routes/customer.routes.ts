import { Router } from 'express';
import { getAllCustomers, createCustomer } from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getAllCustomers);
router.post('/', authenticate, createCustomer);

export default router;
