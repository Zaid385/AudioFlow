import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import Song from '../models/Song';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import { uploadAudio, uploadImage, deleteFromCloudinary } from '../utils/cloudinary';
import { parseAudioMetadata } from '../utils/metadataParser';

export const getSongs = asyncHandler(async (req: Request, res: Response) => {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.status(200).json({
        status: 'success',
        results: songs.length,
        data: { songs }
    });
});

/**
 * Analyzes audio file and returns metadata + temp art path
 */
export const analyzeAudio = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError('No audio file provided', 400);
    }

    const metadata = await parseAudioMetadata(req.file.path);
    
    res.status(200).json({
        status: 'success',
        data: {
            metadata,
            tempFilePath: req.file.path
        }
    });
});

/**
 * Final upload to Cloudinary and Save to DB
 */
export const uploadSong = asyncHandler(async (req: Request, res: Response) => {
    const { title, artist, album, genre, year, duration, trackNumber, tempFilePath, tempArtPath } = req.body;

    if (!title || !artist || !duration) {
        throw new AppError('Title, Artist, and Duration are required', 400);
    }

    // Determine final audio file to upload
    let audioPath = tempFilePath;
    if (req.files && (req.files as any).audioFile) {
        audioPath = (req.files as any).audioFile[0].path;
    }

    if (!audioPath || !(await fs.pathExists(audioPath))) {
        throw new AppError('Audio file missing. Please re-upload.', 400);
    }

    // Determine final cover art to upload
    let coverPath = tempArtPath; // If it was extracted
    if (req.files && (req.files as any).coverArt) {
        coverPath = (req.files as any).coverArt[0].path;
    }

    // If it's a relative path from the server root (like /uploads/temp/...), normalize it
    if (coverPath && coverPath.startsWith('/')) {
        coverPath = path.join(process.cwd(), 'public', coverPath);
    }

    try {
        // Upload Audio to Cloudinary
        const audioResult = await uploadAudio(audioPath);

        // Upload Cover to Cloudinary (if exists)
        let coverResult = { url: 'https://i.scdn.co/image/ab67616d0000b273767228a4c3f56b7145e69e00', publicId: undefined }; // Default
        if (coverPath && await fs.pathExists(coverPath)) {
            const uploadedCover = await uploadImage(coverPath);
            coverResult = { url: uploadedCover.url, publicId: uploadedCover.publicId as any };
        }

        // Save to MongoDB
        const newSong = await Song.create({
            title,
            artist,
            album: album || 'Unknown Album',
            genre: genre || 'Various',
            year: year ? parseInt(year) : undefined,
            duration,
            trackNumber: trackNumber ? parseInt(trackNumber) : undefined,
            audioUrl: audioResult.url,
            coverUrl: coverResult.url,
            cloudinaryPublicId: audioResult.publicId,
            coverPublicId: coverResult.publicId,
        });

        // Cleanup temp files
        if (audioPath && !audioPath.includes('public/uploads/audio')) {
            await fs.remove(audioPath).catch(console.error);
        }
        if (coverPath && coverPath.includes('public/uploads/temp')) {
            await fs.remove(coverPath).catch(console.error);
        }

        res.status(201).json({
            status: 'success',
            data: { song: newSong }
        });
    } catch (error: any) {
        throw new AppError(`Upload failed: ${error.message}`, 500);
    }
});

export const updateSong = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) throw new AppError('Song not found', 404);

    const updateData = { ...req.body };
    
    // Handle cover image update if provided
    if (req.file) {
        const coverResult = await uploadImage(req.file.path);
        
        // Delete old cover from Cloudinary if it exists
        if (song.coverPublicId) {
            await deleteFromCloudinary(song.coverPublicId);
        }
        
        updateData.coverUrl = coverResult.url;
        updateData.coverPublicId = coverResult.publicId;
        
        // Cleanup temp file
        await fs.remove(req.file.path).catch(console.error);
    }

    const updatedSong = await Song.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    res.status(200).json({
        status: 'success',
        data: { song: updatedSong }
    });
});

export const deleteSong = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) throw new AppError('Song not found', 404);

    // Delete from Cloudinary
    await deleteFromCloudinary(song.cloudinaryPublicId, 'video');
    if (song.coverPublicId) {
        await deleteFromCloudinary(song.coverPublicId, 'image');
    }

    // Delete from DB
    await Song.findByIdAndDelete(id);

    res.status(200).json({
        status: 'success',
        message: 'Song deleted successfully'
    });
});

export const batchDeleteSongs = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('No song IDs provided', 400);
    }

    const songs = await Song.find({ _id: { $in: ids } });

    // Delete all from Cloudinary
    for (const song of songs) {
        await deleteFromCloudinary(song.cloudinaryPublicId, 'video').catch(console.error);
        if (song.coverPublicId) {
            await deleteFromCloudinary(song.coverPublicId, 'image').catch(console.error);
        }
    }

    // Delete all from DB
    await Song.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
        status: 'success',
        message: `${songs.length} songs deleted successfully`
    });
});
