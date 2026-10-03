import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { Request } from 'express';

const MAX_FILE_SIZE = config.upload.maxFileSizeMB * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(config.upload.allowedMimeTypes);

const storage = multer.memoryStorage(); // store in memory, upload to Cloudinary

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Allowed: ${config.upload.allowedMimeTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }

  // Validate extension matches MIME
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  if (!validExtensions.includes(ext)) {
    return cb(
      new AppError(
        'File extension does not match allowed types.',
        400,
        'INVALID_FILE_EXTENSION'
      )
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // max 10 files per request
  },
});

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<{ url: string; publicId: string }> => {
  const { cloudinary } = await import('../config/cloudinary');

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `fastvelix/${folder}`,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    ).end(buffer);
  });
};
