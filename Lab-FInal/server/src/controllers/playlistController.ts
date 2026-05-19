import { Request, Response } from 'express';
import Playlist from '../models/Playlist';
import Song from '../models/Song';
import { playlistSchema } from '../utils/validators';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

export const getPlaylists = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  let playlists = await Playlist.find({ user: user._id }).populate('songs');
  
  // Ensure Liked Songs exists
  const hasLiked = playlists.some(p => p.name === 'Liked Songs');
  if (!hasLiked) {
    const liked = await Playlist.create({ name: 'Liked Songs', user: user._id, songs: [] });
    playlists.push(liked);
  }

  res.render('playlists', { playlists, title: 'My Playlists' });
});

export const getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
  const playlist = await Playlist.findOne({ _id: req.params.id, user: (req as any).user!._id }).populate('songs');
  if (!playlist) throw new AppError('Playlist not found', 404);
  res.render('playlist-detail', { playlist, title: playlist.name });
});

export const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const result = playlistSchema.safeParse(req.body);
  if (!result.success) {
    req.flash('error', result.error.errors[0].message);
    return res.redirect('/playlists');
  }

  await Playlist.create({
    name: result.data.name,
    user: (req as any).user!._id,
    songs: []
  });

  req.flash('success', 'Playlist created successfully!');
  res.redirect('/playlists');
});

export const addSongToPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { playlistId, songId } = req.params;
  const playlist = await Playlist.findOne({ _id: playlistId, user: (req as any).user!._id });

  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  if (playlist.songs.some(id => id.toString() === songId)) {
    req.flash('error', 'Song already in playlist');
    return res.redirect('back');
  }

  playlist.songs.push(songId as any);
  await playlist.save();

  req.flash('success', 'Song added to playlist!');
  res.redirect('back');
});

export const removeSongFromPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { playlistId, songId } = req.params;
  const playlist = await Playlist.findOne({ _id: playlistId, user: (req as any).user!._id });

  if (!playlist) {
    throw new AppError('Playlist not found', 404);
  }

  playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
  await playlist.save();

  req.flash('success', 'Song removed from playlist');
  res.redirect('back');
});

export const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const playlist = await Playlist.findOne({ _id: id, user: (req as any).user!._id });
  
  if (playlist && playlist.name === 'Liked Songs') {
    req.flash('error', 'The Liked Songs playlist cannot be deleted.');
    return res.redirect('/playlists');
  }

  await Playlist.findOneAndDelete({ _id: id, user: (req as any).user!._id });
  
  req.flash('success', 'Playlist deleted');
  res.redirect('/playlists');
});
