import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request } from 'express';
import { redisClient } from '../config/redis';
import { t } from '../config/i18n';
import { AuthRequest } from '../types';

/**
 * Helper function to create Redis Store instances
 */
const createRedisStore = (prefix: string) => {
  return new RedisStore({
    sendCommand: async (...args: string[]) => {
      const [command, ...rest] = args;
      // @ts-expect-error - Dynamic command execution
      return await redisClient[command.toLowerCase()](...rest);
    },
    prefix: `rl:${prefix}:`,
  });
};

/**
 * General API Rate Limiter
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: (req: Request) => {
    const authReq = req as AuthRequest;
    return {
      success: false,
      message: t('common.too_many_requests', {}, authReq.language),
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('api'),
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    if (authReq.user) {
      return `user:${authReq.user.userId}`;
    }
    throw new Error('Authentication required');
  },
  skip: (req: Request) => {
    const authReq = req as AuthRequest;
    return !authReq.user;
  },
});

/**
 * Strict Rate Limiter for Auth endpoints
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: (req: Request) => {
    const authReq = req as AuthRequest;
    return {
      success: false,
      message: t('common.too_many_requests', {}, authReq.language),
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: createRedisStore('auth'),
});

/**
 * Voucher Issuance Rate Limiter
 */
export const voucherLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: (req: Request) => {
    const authReq = req as AuthRequest;
    return {
      success: false,
      message: t('common.too_many_requests', {}, authReq.language),
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('voucher'),
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    if (authReq.user) {
      return `voucher:${authReq.user.userId}`;
    }
    throw new Error('Authentication required for voucher operations');
  },
});

export default {
  apiLimiter,
  authLimiter,
  voucherLimiter,
};
