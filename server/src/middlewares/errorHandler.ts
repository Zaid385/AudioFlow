import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // EJS Error Handling
  console.error('ERROR 💥', err);
  req.flash('error', err.message || 'Something went wrong!');
  res.redirect('back');
};

export default errorHandler;
