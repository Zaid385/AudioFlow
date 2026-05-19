import { Router } from 'express';
import * as playlistController from '../controllers/playlistController';
import { isLoggedIn } from '../middlewares/auth';

const router = Router();

router.use(isLoggedIn);

router.get('/', playlistController.getPlaylists);
router.get('/:id', playlistController.getPlaylistById);
router.post('/', playlistController.createPlaylist);
router.post('/:playlistId/add/:songId', playlistController.addSongToPlaylist);
router.post('/:playlistId/remove/:songId', playlistController.removeSongFromPlaylist);
router.post('/delete/:id', playlistController.deletePlaylist);

export default router;
