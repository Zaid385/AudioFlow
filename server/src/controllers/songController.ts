import { Request, Response } from 'express';
import Song from '../models/Song';
import asyncHandler from '../utils/asyncHandler';

export const getSongs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.genre) filter.genre = req.query.genre;
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  let sort: any = { createdAt: -1 };
  if (req.query.sort === 'popularity') sort = { playCount: -1 };
  if (req.query.sort === 'alphabetical') sort = { title: 1 };
  if (req.query.sort === 'latest') sort = { createdAt: -1 };

  const songs = await Song.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalSongs = await Song.countDocuments(filter);
  const totalPages = Math.ceil(totalSongs / limit);

  res.render('songs', {
    songs,
    currentPage: page,
    totalPages,
    genre: req.query.genre || '',
    search: req.query.search || '',
    sort: req.query.sort || 'latest',
    title: 'Music Library'
  });
});

export const getIndex = asyncHandler(async (req: Request, res: Response) => {
  const trendingSongs = await Song.find().sort({ playCount: -1 }).limit(10);
  const latestSongs = await Song.find().sort({ createdAt: -1 }).limit(10);
  
  res.render('index', { 
    trendingSongs, 
    latestSongs,
    title: 'Home' 
  });
});
