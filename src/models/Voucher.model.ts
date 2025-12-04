import mongoose, { Schema } from 'mongoose';
import { IVoucher } from '../types';

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        const result = { ...ret };
        delete result.__v;
        return result;
      },
    },
  }
);

VoucherSchema.index({ code: 1 }, { unique: true });
VoucherSchema.index({ eventId: 1, userId: 1 });
VoucherSchema.index({ isUsed: 1, expiresAt: 1 });
VoucherSchema.index({ userId: 1, issuedAt: -1 });

// Virtual: Is expired
VoucherSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

// Virtual: Status
VoucherSchema.virtual('status').get(function () {
  if (this.isUsed) return 'used';
  if (this.isExpired) return 'expired';
  return 'available';
});

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);
export default Voucher;
