import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ==================== ENUMS ====================

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum Permission {
  // Event Permissions
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_READ_ALL = 'event:read:all',

  // Voucher Permissions
  VOUCHER_ISSUE = 'voucher:issue',
  VOUCHER_READ = 'voucher:read',
  VOUCHER_READ_ALL = 'voucher:read:all',
  VOUCHER_USE = 'voucher:use',

  // User Permissions
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage:roles',

  // System Permissions
  SYSTEM_SETTINGS = 'system:settings',
}

export enum VoucherStatus {
  AVAILABLE = 'available',
  ISSUED = 'issued',
  USED = 'used',
  EXPIRED = 'expired',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum Language {
  EN = 'en',
  VI = 'vi',
}

// ==================== ROLE PERMISSIONS MAPPING ====================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.EVENT_READ_ALL,
    Permission.VOUCHER_ISSUE,
    Permission.VOUCHER_READ,
    Permission.VOUCHER_READ_ALL,
    Permission.VOUCHER_USE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
    Permission.SYSTEM_SETTINGS,
  ],
  [UserRole.MANAGER]: [
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_READ_ALL,
    Permission.VOUCHER_READ_ALL,
    Permission.USER_READ,
  ],
  [UserRole.USER]: [
    Permission.EVENT_READ,
    Permission.VOUCHER_ISSUE,
    Permission.VOUCHER_READ,
    Permission.VOUCHER_USE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
  ],
};

// ==================== MODELS INTERFACES ====================

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  language: Language;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: Permission): boolean;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxVouchers: number;
  issuedVouchers: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoucher extends Document {
  _id: Types.ObjectId;
  code: string;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  issuedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  isExpired: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEditLock extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  userEmail: string;
  lockedAt: Date;
  expiresAt: Date;
}

// ==================== REQUEST TYPES ====================

export interface AuthCredentials {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  language: Language;
}

export interface AuthRequest extends Request {
  user?: AuthCredentials;
  language?: Language;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== AUTH TYPES ====================

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: Language;
}

export interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  language: Language;
  isActive: boolean;
  createdAt: Date;
}

export interface LoginResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

// ==================== EVENT TYPES ====================

export interface CreateEventDTO {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxVouchers: number;
  isActive?: boolean;
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  maxVouchers?: number;
  isActive?: boolean;
}

// ==================== VOUCHER TYPES ====================

export interface IssueVoucherDTO {
  eventId: string;
}

export interface VoucherResponse {
  id: string;
  code: string;
  eventId: string;
  eventTitle: string;
  issuedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  status: VoucherStatus;
}

// ==================== EMAIL TYPES ====================

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  context?: {
    voucherCode?: string;
    eventTitle?: string;
    userName?: string;
    [key: string]: unknown;
  };
}

// ==================== SOCKET TYPES ====================

export interface SocketAuthData {
  userId: string;
  token: string;
}

export interface EditLockEvent {
  eventId: string;
  userId: string;
  userEmail: string;
  action: 'lock' | 'release' | 'maintain';
  expiresAt?: Date;
}

// ==================== UTILITY TYPES ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}
