import express from 'express';
import { authenticate } from '../middleware/auth';
import { ChatRoom, ChatMessage } from '../models/Chat';
import { socketService } from '../services/socketService';

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/chat/rooms
 * List user's active chat rooms
 */
router.get('/rooms', async (req: any, res: any) => {
  const userId = req.user._id;
  const rooms = await ChatRoom.find({
    'participants.userId': userId,
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  res.json({ success: true, rooms });
});

/**
 * POST /api/chat/rooms
 * Create or retrieve an existing chat room for order support or seller communication
 */
router.post('/rooms', async (req: any, res: any) => {
  const userId = req.user._id;
  const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
  const { recipientId, recipientRole, recipientName, orderId, subject } = req.body;

  // Search if a room already exists with these participants
  const query: any = {
    'participants.userId': userId,
  };
  if (orderId) {
    query.orderId = orderId;
  } else if (recipientId) {
    query['participants.userId'] = { $all: [userId, recipientId] };
  }

  let room = await ChatRoom.findOne(query);

  if (!room) {
    const participants: any[] = [
      { userId, role: req.user.role || 'CUSTOMER', name: userName },
    ];

    if (recipientId) {
      participants.push({
        userId: recipientId,
        role: recipientRole || 'SUPPORT',
        name: recipientName || 'Support Agent',
      });
    }

    room = await ChatRoom.create({
      participants,
      orderId: orderId || null,
      subject: subject || (orderId ? `Order #${orderId}` : 'Customer Support'),
      status: 'OPEN',
    });
  }

  res.status(201).json({ success: true, room });
});

/**
 * GET /api/chat/rooms/:roomId/messages
 * Get message history for a chat room
 */
router.get('/rooms/:roomId/messages', async (req: any, res: any) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await ChatRoom.findOne({
    _id: roomId,
    'participants.userId': userId,
  });

  if (!room) {
    return res.status(404).json({ success: false, message: 'Chat room not found or access denied.' });
  }

  const messages = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).lean();

  res.json({ success: true, messages });
});

/**
 * POST /api/chat/rooms/:roomId/messages
 * Send a chat message (saves to DB and emits real-time WebSocket event)
 */
router.post('/rooms/:roomId/messages', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { content, attachments } = req.body;
  const userId = req.user._id;
  const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  const room = await ChatRoom.findOne({
    _id: roomId,
    'participants.userId': userId,
  });

  if (!room) {
    return res.status(404).json({ success: false, message: 'Chat room not found or access denied.' });
  }

  const message = await ChatMessage.create({
    roomId,
    senderId: userId,
    senderName,
    senderRole: req.user.role || 'CUSTOMER',
    content: content.trim(),
    attachments: attachments || [],
    isRead: false,
  });

  // Update room last message info
  room.lastMessage = content.trim();
  room.lastMessageAt = new Date();
  await room.save();

  // Broadcast to Socket.io room listeners
  socketService.emitChatMessage(roomId, message.toObject());

  // Notify offline/other participants via personal socket push notifications
  room.participants.forEach((p) => {
    if (p.userId.toString() !== userId.toString()) {
      socketService.sendNotificationToUser(p.userId.toString(), {
        type: 'SYSTEM',
        title: `New message from ${senderName}`,
        message: content.trim(),
        deepLink: `/chat?roomId=${roomId}`,
      });
    }
  });

  res.status(201).json({ success: true, message });
});

export default router;
