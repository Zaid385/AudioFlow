import { Router } from 'express';
import * as adminApiController from '../controllers/adminApiController';
import { isLoggedIn, isAdmin } from '../middlewares/auth';
import { upload } from '../config/multer';

const router = Router();

// Protect all admin API routes
router.use(isLoggedIn, isAdmin);

router.get('/songs', adminApiController.getSongs);

// Metadata analysis (immediate parse)
router.post('/analyze', upload.single('audioFile'), adminApiController.analyzeAudio);

// Final upload
router.post('/upload-song', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverArt', maxCount: 1 }
]), adminApiController.uploadSong);

router.delete('/songs/batch', adminApiController.batchDeleteSongs);
router.put('/song/:id', upload.single('coverArt'), adminApiController.updateSong);
router.delete('/song/:id', adminApiController.deleteSong);

export default router;
