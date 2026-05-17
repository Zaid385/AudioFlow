import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Song from '../models/Song';
import Playlist from '../models/Playlist';
import { loginSchema, playlistSchema } from '../utils/validators';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

const signToken = (id: string, role: string) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '90d'
  });
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(result.error.errors[0].message, 400);
  }

  const { email, password } = result.data;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken((user._id as any).toString(), user.role);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: (req as any).user
    }
  });
});

export const getSongs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.genre) filter.genre = req.query.genre;
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  let sort: any = { createdAt: -1 };
  if (req.query.sort === 'popularity') sort = { playCount: -1 };
  if (req.query.sort === 'alphabetical') sort = { title: 1 };

  const songs = await Song.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Song.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: songs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: { songs }
  });
});

export const getSong = asyncHandler(async (req: Request, res: Response) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw new AppError('Song not found', 404);
  
  res.status(200).json({
    status: 'success',
    data: { song }
  });
});

export const getPlaylists = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  let playlists = await Playlist.find({ user: user._id }).populate('songs');
  
  const hasLiked = playlists.some(p => p.name === 'Liked Songs');
  if (!hasLiked) {
    const liked = await Playlist.create({ name: 'Liked Songs', user: user._id, songs: [] });
    playlists.push(liked);
  }

  res.status(200).json({
    status: 'success',
    data: { playlists }
  });
});

export const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const result = playlistSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(result.error.errors[0].message, 400);
  }

  const playlist = await Playlist.create({
    name: result.data.name,
    user: (req as any).user!._id,
    songs: []
  });

  res.status(201).json({
    status: 'success',
    data: { playlist }
  });
});

export const addSongToPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { id, songId } = req.params;
  const playlist = await Playlist.findOne({ _id: id, user: (req as any).user!._id });

  if (!playlist) throw new AppError('Playlist not found', 404);
  if (playlist.songs.some(id => id.toString() === songId)) {
    throw new AppError('Song already in playlist', 400);
  }

  playlist.songs.push(songId as any);
  await playlist.save();

  res.status(200).json({
    status: 'success',
    data: { playlist }
  });
});

export const removeSongFromPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { id, songId } = req.params;
  const playlist = await Playlist.findOne({ _id: id, user: (req as any).user!._id });

  if (!playlist) throw new AppError('Playlist not found', 404);

  playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
  await playlist.save();

  res.status(200).json({
    status: 'success',
    data: { playlist }
  });
});
