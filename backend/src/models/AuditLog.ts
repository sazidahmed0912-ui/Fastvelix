import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true }, // e.g. 'SELLER_APPROVED', 'ORDER_CANCELLED', 'PRODUCT_REJECTED'
    entity: { type: String, required: true }, // e.g. 'Seller', 'Order', 'Product'
    entityId: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    // Audit logs are append-only — disable update hooks
  }
);

// Audit logs should never be deleted by ordinary admins
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
