import * as mm from 'music-metadata';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';

export interface ParsedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string[];
  year?: number;
  duration?: string;
  trackNumber?: number;
  embeddedArtPath?: string;
}

const formatDuration = (durationSeconds: number): string => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const parseAudioMetadata = async (filePath: string): Promise<ParsedMetadata> => {
  try {
    const metadata = await mm.parseFile(filePath);
    const { common, format } = metadata;

    let embeddedArtPath: string | undefined;

    // Extract embedded art if it exists
    if (common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      const tempDir = path.join(process.cwd(), 'public/uploads/temp');
      await fs.ensureDir(tempDir);
      
      const fileName = `art-${crypto.randomBytes(8).toString('hex')}.${picture.format.split('/')[1] || 'jpg'}`;
      embeddedArtPath = path.join(tempDir, fileName);
      await fs.writeFile(embeddedArtPath, picture.data);
    }

    return {
      title: common.title,
      artist: common.artist,
      album: common.album,
      genre: common.genre,
      year: common.year,
      duration: format.duration ? formatDuration(format.duration) : undefined,
      trackNumber: common.track.no || undefined,
      embeddedArtPath: embeddedArtPath ? `/uploads/temp/${path.basename(embeddedArtPath)}` : undefined
    };
  } catch (error) {
    console.error('Metadata Parsing Error:', error);
    return {};
  }
};
