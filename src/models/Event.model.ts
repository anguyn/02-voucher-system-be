import mongoose, { Schema } from 'mongoose';
import { IEvent } from '../types';

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxVouchers: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    issuedVouchers: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ isActive: 1, startDate: 1 });
EventSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual: Available vouchers
EventSchema.virtual('availableVouchers').get(function () {
  return this.maxVouchers - this.issuedVouchers;
});

// Virtual: Event status
EventSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'ended';
  return 'active';
});

EventSchema.pre('save', function () {
  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
export default Event;
