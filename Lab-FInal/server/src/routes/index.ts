import { Router } from 'express';
import authRoutes from './authRoutes';
import songRoutes from './songRoutes';
import playlistRoutes from './playlistRoutes';
import adminRoutes from './adminRoutes';
import apiRoutes from './apiRoutes';
import adminApiRoutes from './adminApiRoutes';
import salesRoutes from './salesRoutes';

const router = Router();

// API Routes
router.use('/api/v1', apiRoutes);
router.use('/api/admin', adminApiRoutes);

// EJS Routes
router.use('/', songRoutes);
router.use('/', authRoutes);
router.use('/playlists', playlistRoutes);
router.use('/admin', adminRoutes);
router.use('/', salesRoutes);

export default router;
