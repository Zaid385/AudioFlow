import { Request, Response } from 'express';
import Song from '../models/Song';
import { songSchema } from '../utils/validators';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.render('admin/dashboard', { songs, title: 'Admin Dashboard' });
});

export const getAddSong = (req: Request, res: Response) => {
  res.render('admin/add-song', { title: 'Add New Song' });
};

export const postAddSong = asyncHandler(async (req: Request, res: Response) => {
  const result = songSchema.safeParse(req.body);
  if (!result.success) {
    req.flash('error', result.error.errors[0].message);
    return res.redirect('/admin/songs/add');
  }

  // Multer will provide files in req.files
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  if (!files || !files.albumArt || !files.audioFile) {
    req.flash('error', 'Both album art and audio file are required');
    return res.redirect('/admin/songs/add');
  }

  const albumArt = `/uploads/images/${files.albumArt[0].filename}`;
  const audioUrl = `/uploads/audio/${files.audioFile[0].filename}`;

  await Song.create({
    ...result.data,
    albumArt,
    audioUrl
  });

  req.flash('success', 'Song added successfully!');
  res.redirect('/admin/dashboard');
});

export const getEditSong = asyncHandler(async (req: Request, res: Response) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new AppError('Song not found', 404);
  res.render('admin/edit-song', { song, title: 'Edit Song' });
});

export const postEditSong = asyncHandler(async (req: Request, res: Response) => {
  const result = songSchema.safeParse(req.body);
  if (!result.success) {
    req.flash('error', result.error.errors[0].message);
    return res.redirect(`/admin/songs/edit/${req.params.id}`);
  }

  const song = await Song.findById(req.params.id);
  if (!song) throw new AppError('Song not found', 404);

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  const updateData: any = { ...result.data };
  if (files && files.albumArt) {
    updateData.albumArt = `/uploads/images/${files.albumArt[0].filename}`;
  }
  if (files && files.audioFile) {
    updateData.audioUrl = `/uploads/audio/${files.audioFile[0].filename}`;
  }

  await Song.findByIdAndUpdate(req.params.id, updateData);

  req.flash('success', 'Song updated successfully!');
  res.redirect('/admin/dashboard');
});

export const deleteSong = asyncHandler(async (req: Request, res: Response) => {
  await Song.findByIdAndDelete(req.params.id);
  req.flash('success', 'Song deleted successfully!');
  res.redirect('/admin/dashboard');
});

export const getManageSongs = asyncHandler(async (req: Request, res: Response) => {
  // Render the new admin management page
  res.render('admin/manage-songs', { title: 'Manage Songs' });
});
