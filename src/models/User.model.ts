import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserRole, Permission, ROLE_PERMISSIONS, Language } from '../types';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    permissions: {
      type: [String],
      enum: Object.values(Permission),
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      enum: Object.values(Language),
      default: Language.EN,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        const result = { ...ret };
        delete result.password;
        delete result.__v;
        return result;
      },
    },
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.pre('save', function () {
  if (this.isModified('role')) {
    this.permissions = ROLE_PERMISSIONS[this.role as UserRole] || [];
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.hasPermission = function (permission: Permission): boolean {
  return this.permissions.includes(permission);
};

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
