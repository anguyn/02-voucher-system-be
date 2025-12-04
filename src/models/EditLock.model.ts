import mongoose, { Schema } from 'mongoose';
import { IEditLock } from '../types';

const EditLockSchema = new Schema<IEditLock>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    lockedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

EditLockSchema.index({ eventId: 1 }, { unique: true });
EditLockSchema.index({ userId: 1 });
EditLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EditLock = mongoose.model<IEditLock>('EditLock', EditLockSchema, 'edit_locks');
export default EditLock;
