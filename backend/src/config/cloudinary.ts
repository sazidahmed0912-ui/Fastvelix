import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export { cloudinary };

export const uploadImage = async (
  filePath: string,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `fastvelix/${folder}`,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    ...options,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const generateThumbnail = (url: string, width = 400, height = 400): string => {
  return cloudinary.url(url, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
};
