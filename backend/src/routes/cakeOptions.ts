import { Router } from 'express';
import { CakeSize, CakeFlavour, CakeStyle, CakeTopper, CakeDecoration } from '../models/CakeOption';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * GET /api/cake-options
 * Public API to fetch all active custom cake options (sizes, flavours, styles, toppers, decorations)
 */
router.get('/', async (_req, res, next) => {
  try {
    const [sizes, flavours, styles, toppers, decorations] = await Promise.all([
      CakeSize.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      CakeFlavour.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      CakeStyle.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      CakeTopper.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      CakeDecoration.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);

    res.json({
      success: true,
      options: {
        sizes,
        flavours,
        styles,
        toppers,
        decorations,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cake-options/flavours
 */
router.get('/flavours', async (_req, res, next) => {
  try {
    const flavours = await CakeFlavour.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, flavours });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cake-options/styles
 */
router.get('/styles', async (_req, res, next) => {
  try {
    const styles = await CakeStyle.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, styles });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cake-options/sizes
 */
router.get('/sizes', async (_req, res, next) => {
  try {
    const sizes = await CakeSize.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, sizes });
  } catch (err) {
    next(err);
  }
});

/**
 * ADMIN ENDPOINTS — Create/Update Cake Options dynamically
 */
router.post('/sizes', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const size = await CakeSize.create(req.body);
    res.status(201).json({ success: true, size });
  } catch (err) {
    next(err);
  }
});

router.post('/flavours', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const flavour = await CakeFlavour.create(req.body);
    res.status(201).json({ success: true, flavour });
  } catch (err) {
    next(err);
  }
});

router.post('/styles', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const style = await CakeStyle.create(req.body);
    res.status(201).json({ success: true, style });
  } catch (err) {
    next(err);
  }
});

router.post('/toppers', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const topper = await CakeTopper.create(req.body);
    res.status(201).json({ success: true, topper });
  } catch (err) {
    next(err);
  }
});

export default router;
