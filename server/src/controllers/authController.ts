import { Request, Response } from 'express';
import User from '../models/User';
import Playlist from '../models/Playlist';
import { registerSchema, loginSchema } from '../utils/validators';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

export const getRegister = (req: Request, res: Response) => {
  res.render('register', { title: 'Register' });
};

export const postRegister = asyncHandler(async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    req.flash('error', result.error.errors[0].message);
    return res.redirect('/register');
  }

  const { name, email, password } = result.data;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    req.flash('error', 'Email already in use');
    return res.redirect('/register');
  }

  const user = await User.create({ name, email, password });
  
  // Create default Liked Songs playlist
  await Playlist.create({
    name: 'Liked Songs',
    user: user._id,
    songs: []
  });

  (req.session as any).userId = (user._id as any).toString();
  (req.session as any).role = user.role;
  
  req.flash('success', 'Registration successful! Welcome to AudioFlow.');
  res.redirect('/');
});

export const getLogin = (req: Request, res: Response) => {
  res.render('login', { title: 'Login' });
};

export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    req.flash('error', result.error.errors[0].message);
    return res.redirect('/login');
  }

  const { email, password } = result.data;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    req.flash('error', 'Invalid email or password');
    return res.redirect('/login');
  }

  (req.session as any).userId = (user._id as any).toString();
  (req.session as any).role = user.role;

  req.flash('success', 'Logged in successfully!');
  res.redirect('/');
});

export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destruction error:', err);
    res.redirect('/');
  });
};

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!(req as any).user) return res.redirect('/login');
  res.render('profile', { title: 'Profile' });
});

export const postUpdateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.redirect('/login');

  const { name, email } = req.body;
  
  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email already in use');
      return res.redirect('/profile');
    }
  }

  await User.findByIdAndUpdate(user._id, { name, email });
  req.flash('success', 'Profile updated successfully!');
  res.redirect('/profile');
});
