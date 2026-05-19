import { Router } from 'express';
import { getSalesDashboard, getSalesData } from '../controllers/salesController';
import { isAdmin } from '../middlewares/auth';

const router = Router();

// SSR Dashboard
router.get('/sales', isAdmin, getSalesDashboard);

// API Endpoint
router.get('/api/sales-data', isAdmin, getSalesData);

export default router;
