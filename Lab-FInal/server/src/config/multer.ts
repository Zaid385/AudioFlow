import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs-extra';
import AppError from '../utils/AppError';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'public/uploads/temp';
    
    if (file.fieldname === 'albumArt') {
      dest = 'public/uploads/images';
    } else if (file.fieldname === 'audioFile') {
      // If it's a final upload, we might want to save it elsewhere, 
      // but for now temp is fine as we upload to Cloudinary and delete.
      dest = 'public/uploads/temp';
    }
    
    fs.ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedAudio = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
  const allowedImages = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'audioFile' || file.fieldname === 'audio') {
    if (allowedAudio.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid audio format!', 400), false);
    }
  } else if (file.fieldname === 'albumArt' || file.fieldname === 'coverArt' || file.fieldname === 'cover') {
    if (allowedImages.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid image format!', 400), false);
    }
  } else {
    cb(null, true);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // Increased to 20MB for high-quality audio
  }
});
