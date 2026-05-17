import express, { Request, Response } from "express";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db';
import routes from './src/routes';
import { setLocals, loadUser } from './src/middlewares/auth';
import errorHandler from './src/middlewares/errorHandler';

dotenv.config();

const app = express();

// Database connection
connectDB();

// Views engine
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));
app.use('/uploads/temp', express.static(path.join(process.cwd(), 'public/uploads/temp')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'audioflow-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/audioflow',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

app.use(flash());
app.use(loadUser);
app.use(setLocals);

// Routes
app.use(routes);

// 404 handler
app.use((req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ status: 'fail', message: 'Endpoint not found' });
  }
  res.status(404).render('404', { title: '404 - Not Found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`)
});
