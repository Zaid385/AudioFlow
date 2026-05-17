import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadAudio = async (filePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video', // Cloudinary handles audio as video resource type
      folder: 'audioflow/songs',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary Audio Upload Error:', error);
    throw error;
  }
};

export const uploadImage = async (filePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder: 'audioflow/covers',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary Image Upload Error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
  }
};

export default cloudinary;
