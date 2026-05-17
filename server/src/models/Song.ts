import mongoose, { Schema, Document } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  duration: string; // e.g., "3:45"
  trackNumber?: number;
  audioUrl: string;
  coverUrl: string;
  albumArt?: string; // Legacy support
  cloudinaryPublicId: string;
  coverPublicId?: string;
  playCount: number;
}

const songSchema: Schema = new Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, default: 'Unknown Album' },
  genre: { type: String, required: true },
  year: { type: Number },
  duration: { type: String, required: true },
  trackNumber: { type: Number },
  audioUrl: { type: String, required: true },
  coverUrl: { type: String }, // Made optional if albumArt exists
  albumArt: { type: String }, // Legacy support
  cloudinaryPublicId: { type: String }, // Made optional for seeded/legacy
  coverPublicId: { type: String },
  playCount: { type: Number, default: 0 }
}, { timestamps: true });

// Indexing for search
songSchema.index({ title: 'text', artist: 'text', album: 'text' });

export default mongoose.model<ISong>('Song', songSchema);
