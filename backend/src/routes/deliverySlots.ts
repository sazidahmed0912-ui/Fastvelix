import { Router } from 'express';
import { DeliverySlot, BlockedDate } from '../models/DeliverySlot';
import { Order } from '../models/Order';

const router = Router();

/**
 * GET /api/delivery/availability
 * Calculate available delivery dates for the next 30 days based on preparation lead time
 */
router.get('/availability', async (req, res, next) => {
  try {
    const { preparationHours = '24' } = req.query;
    const leadHours = parseInt(preparationHours as string, 10) || 24;

    const blockedDocs = await BlockedDate.find().lean();
    const blockedDateSet = new Set(blockedDocs.map((b) => b.date));

    const availableDates = [];
    const now = new Date();
    const minDate = new Date(now.getTime() + leadHours * 60 * 60 * 1000);

    for (let i = 0; i < 30; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];
      if (!blockedDateSet.has(dateStr)) {
        availableDates.push({
          date: dateStr,
          dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
          formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    res.json({ success: true, leadHours, availableDates });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/delivery/slots
 * Returns available delivery time slots for a specified date after checking cutoff & slot limits
 */
router.get('/slots', async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required.' });
    }

    const slots = await DeliverySlot.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

    // Check existing order counts for this date
    const orderCounts = await Order.aggregate([
      { $match: { deliveryDate: date, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: '$deliverySlot', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(orderCounts.map((o) => [o._id, o.count]));

    const slotsWithAvailability = slots.map((slot) => {
      const bookedCount = countMap.get(slot.slotTime) || 0;
      const isFull = bookedCount >= slot.maxOrdersPerSlot;

      return {
        slotTime: slot.slotTime,
        cutoffHours: slot.cutoffHours,
        maxOrders: slot.maxOrdersPerSlot,
        bookedCount,
        available: !isFull,
      };
    });

    res.json({ success: true, date, slots: slotsWithAvailability });
  } catch (err) {
    next(err);
  }
});

export default router;
