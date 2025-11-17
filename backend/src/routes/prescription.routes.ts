import { Router } from 'express';
import { upload } from '../config/upload';
import { analyzePrescription } from '../controllers/prescription.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/analyze',
  authenticate,
  upload.single('prescription'),
  analyzePrescription
);

export default router;
