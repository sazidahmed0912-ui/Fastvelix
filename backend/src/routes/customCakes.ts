import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CakeSize, CakeFlavour, CakeStyle, CakeTopper, CakeDecoration } from '../models/CakeOption';
import { AppError } from '../utils/AppError';

const router = Router();

// Configure multer storage for customer reference photos
const uploadDir = path.join(__dirname, '../../uploads/cake-photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `cake_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid image format. Allowed: JPEG, PNG, WEBP.', 400));
    }
  },
});

/**
 * POST /api/custom-cakes/quote
 * Server-authoritative Custom Cake Pricing Engine
 */
router.post('/quote', async (req, res, next) => {
  try {
    const { size, flavour, style, topper, decoration, photoRequired } = req.body;

    let basePrice = 799; // Base 0.5kg signature custom cake
    let sizePrice = 0;
    let flavourPrice = 0;
    let stylePrice = 0;
    let topperPrice = 0;
    let decorationPrice = 0;
    let photoPrice = photoRequired ? 200 : 0;

    // Lookups from DB
    if (size) {
      const sizeDoc = await CakeSize.findOne({ name: size, isActive: true });
      if (sizeDoc) sizePrice = sizeDoc.extraPrice;
    }

    if (flavour) {
      const flavourDoc = await CakeFlavour.findOne({ name: flavour, isActive: true });
      if (flavourDoc) flavourPrice = flavourDoc.extraPrice;
    }

    if (style) {
      const styleDoc = await CakeStyle.findOne({ name: style, isActive: true });
      if (styleDoc) stylePrice = styleDoc.extraPrice;
    }

    if (topper) {
      const topperDoc = await CakeTopper.findOne({ name: topper, isActive: true });
      if (topperDoc) topperPrice = topperDoc.extraPrice;
    }

    if (decoration) {
      const decDoc = await CakeDecoration.findOne({ name: decoration, isActive: true });
      if (decDoc) decorationPrice = decDoc.extraPrice;
    }

    const customizationPrice = sizePrice + flavourPrice + stylePrice + topperPrice + decorationPrice + photoPrice;
    const subtotal = basePrice + customizationPrice;
    const deliveryFee = subtotal >= 999 ? 0 : 49;
    const grandTotal = subtotal + deliveryFee;

    res.json({
      success: true,
      quote: {
        basePrice,
        sizePrice,
        flavourPrice,
        stylePrice,
        topperPrice,
        decorationPrice,
        photoPrice,
        customizationPrice,
        subtotal,
        deliveryFee,
        total: grandTotal,
        currency: 'INR',
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/custom-cakes/upload
 * Photo upload endpoint for reference image
 */
router.post('/upload', upload.single('photo'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No photo file provided.', 400));
    }

    const photoUrl = `/uploads/cake-photos/${req.file.filename}`;
    res.json({
      success: true,
      photoUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
