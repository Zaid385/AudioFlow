import { Router } from 'express';
import * as songController from '../controllers/songController';

const router = Router();

router.get('/', songController.getIndex);
router.get('/songs', songController.getSongs);

export default router;
