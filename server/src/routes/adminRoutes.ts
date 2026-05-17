import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { isLoggedIn, isAdmin } from '../middlewares/auth';
import { upload } from '../config/multer';

const router = Router();

router.use(isLoggedIn, isAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/manage-songs', adminController.getManageSongs);
router.get('/songs/add', adminController.getAddSong);
router.post('/songs/add', upload.fields([
  { name: 'albumArt', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]), adminController.postAddSong);

router.get('/songs/edit/:id', adminController.getEditSong);
router.post('/songs/edit/:id', upload.fields([
  { name: 'albumArt', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]), adminController.postEditSong);

router.post('/songs/delete/:id', adminController.deleteSong);

export default router;
