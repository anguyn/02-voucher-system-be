import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRole, Permission, JWTPayload } from '../types';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const JWT_ACCESS_EXPIRY: '15m' = (process.env.JWT_ACCESS_EXPIRY as '15m') || '15m';
const JWT_REFRESH_EXPIRY: '7d' = (process.env.JWT_REFRESH_EXPIRY as '7d') || '7d';
const JWT_REFRESH_EXPIRY_REMEMBER_ME: '30d' =
  (process.env.JWT_REFRESH_EXPIRY_REMEMBER_ME as '30d') || '30d';

export const generateAccessToken = (
  userId: Types.ObjectId,
  email: string,
  role: UserRole,
  permissions: Permission[]
): string => {
  const payload: JWTPayload = {
    userId: userId.toString(),
    email,
    role,
    permissions,
  };

  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: 'voucher-system',
    audience: 'voucher-api',
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (
  userId: Types.ObjectId,
  email: string,
  role: UserRole,
  permissions: Permission[],
  rememberMe: boolean = false
): string => {
  const payload: JWTPayload = {
    userId: userId.toString(),
    email,
    role,
    permissions,
  };

  const expiry = rememberMe ? JWT_REFRESH_EXPIRY_REMEMBER_ME : JWT_REFRESH_EXPIRY;

  const options: SignOptions = {
    expiresIn: expiry,
    issuer: 'voucher-system',
    audience: 'voucher-api',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'voucher-system',
      audience: 'voucher-api',
    }) as JWTPayload;
    return decoded;
  } catch (_error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'voucher-system',
      audience: 'voucher-api',
    }) as JWTPayload;
    return decoded;
  } catch (_error) {
    throw new Error('Invalid refresh token');
  }
};

export const getRefreshTokenExpiry = (rememberMe: boolean = false): Date => {
  const expiryTime = rememberMe ? JWT_REFRESH_EXPIRY_REMEMBER_ME : JWT_REFRESH_EXPIRY;
  const days = parseInt(expiryTime.replace('d', ''), 10);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
};
