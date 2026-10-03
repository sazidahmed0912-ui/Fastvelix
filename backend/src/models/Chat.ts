import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPPORT';
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: Date;
}

export interface IChatRoom extends Document {
  participants: {
    userId: mongoose.Types.ObjectId;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPPORT';
    name?: string;
  }[];
  orderId?: mongoose.Types.ObjectId;
  subject?: string;
  status: 'OPEN' | 'CLOSED';
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORT'],
      required: true,
    },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: 1 });

const chatRoomSchema = new Schema<IChatRoom>(
  {
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORT'], required: true },
        name: { type: String },
      },
    ],
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    subject: { type: String, default: 'General Support' },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

chatRoomSchema.index({ 'participants.userId': 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
