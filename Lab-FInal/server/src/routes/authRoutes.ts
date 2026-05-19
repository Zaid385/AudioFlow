import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.post('/profile', authController.postUpdateProfile);

export default router;
