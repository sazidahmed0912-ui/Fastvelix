import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Address } from '../models/Address';
import { AppError } from '../utils/AppError';
import geolocationService from '../services/geolocationService';

const router = Router();

// All user routes require auth
router.use(authenticate);

// ─── GET /api/users/addresses ─── Get all saved addresses for current user
router.get('/addresses', async (req: AuthRequest, res, next) => {
  try {
    let addresses = await Address.find({ userId: req.user!._id }).sort({ isDefault: -1, createdAt: -1 });

    // If user has no addresses yet, create a default fallback address for smooth testing & checkout
    if (addresses.length === 0) {
      const defaultAddr = await Address.create({
        userId: req.user!._id,
        label: 'HOME',
        fullName: req.user!.name || 'Demo Customer',
        phone: (req.user as any).phone || '9876543210',
        addressLine1: '123 MG Road, Indiranagar',
        addressLine2: 'Near Metro Station',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India',
        isDefault: true,
      });
      addresses = [defaultAddr];
    }

    res.json({ success: true, addresses });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/users/addresses ─── Add new address
router.post('/addresses', async (req: AuthRequest, res, next) => {
  try {
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return next(new AppError('Missing required address fields.', 400, 'INVALID_INPUT'));
    }

    const existingCount = await Address.countDocuments({ userId: req.user!._id });

    const newAddress = await Address.create({
      userId: req.user!._id,
      label: label || 'HOME',
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: isDefault || existingCount === 0,
    });

    const addresses = await Address.find({ userId: req.user!._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(201).json({ success: true, addresses, newAddress });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/users/addresses/:id ─── Delete address
router.delete('/addresses/:id', async (req: AuthRequest, res, next) => {
  try {
    await Address.deleteOne({ _id: req.params.id, userId: req.user!._id });
    const addresses = await Address.find({ userId: req.user!._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/users/addresses/:id/default ─── Set default address
router.put('/addresses/:id/default', async (req: AuthRequest, res, next) => {
  try {
    await Address.updateMany({ userId: req.user!._id }, { isDefault: false });
    await Address.updateOne({ _id: req.params.id, userId: req.user!._id }, { isDefault: true });

    const addresses = await Address.find({ userId: req.user!._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/profile ─── Get profile
router.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) return next(new AppError('User not found', 404, 'NOT_FOUND'));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/users/profile ─── Update profile
router.put('/profile', async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) return next(new AppError('User not found', 404, 'NOT_FOUND'));

    const { name, phone, whatsappNumber } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (whatsappNumber !== undefined) (user as any).whatsappNumber = whatsappNumber;

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/users/location ─── Update user's geolocation from IP
router.put('/location', async (req: AuthRequest, res, next) => {
  try {
    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const locationData = await geolocationService.getLocationFromIP(ipAddress);

    if (!locationData) {
      return next(new AppError('Could not determine location', 500, 'GEOLOCATION_FAILED'));
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        country: locationData.country,
        countryCode: locationData.countryCode,
        ipAddress,
        lastLocationUpdate: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/map-data ─── Active users map (Admin only)
router.get('/map-data', authorize('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const users = await User.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      lastLocationUpdate: { $gte: twentyFourHoursAgo },
    })
      .select('name email latitude longitude city country countryCode lastLocationUpdate')
      .lean();

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

export default router;
