import { Router } from 'express';
import * as apiController from '../controllers/apiController';
import { verifyToken } from '../middlewares/apiAuth';

const router = Router();

// Public routes
router.post('/auth/login', apiController.login);
router.get('/songs', apiController.getSongs);
router.get('/songs/:id', apiController.getSong);

// Protected routes
router.use(verifyToken);

router.get('/user/profile', apiController.getProfile);
router.get('/playlists', apiController.getPlaylists);
router.post('/playlists', apiController.createPlaylist);
router.post('/playlists/:id/add-song/:songId', apiController.addSongToPlaylist);
router.post('/playlists/:id/remove/:songId', apiController.removeSongFromPlaylist);

export default router;
