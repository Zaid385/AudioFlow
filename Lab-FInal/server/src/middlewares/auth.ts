import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';

export const loadUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).userId) {
    const user = await User.findById((req.session as any).userId);
    if (user) {
      (req as any).user = user;
    }
  }
  next();
});

export const isLoggedIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user) {
    return next();
  }
  
  req.flash('error', 'You must be logged in to access this page.');
  res.redirect('/login');
});

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user && (req as any).user.role === 'admin') {
    return next();
  }
  
  req.flash('error', 'You do not have permission to perform this action.');
  res.redirect('/');
};

export const setLocals = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  res.locals.user = user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  
  if (user) {
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '90d' }
    );
    res.locals.token = token;
  } else {
    res.locals.token = null;
  }
  
  next();
};
