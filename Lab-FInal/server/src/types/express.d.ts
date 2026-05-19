import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: 'customer' | 'admin';
  }
}
