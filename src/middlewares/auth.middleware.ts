import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { User } from '../models';
import { AuthRequest, AuthCredentials, Permission } from '../types';
import { t } from '../config/i18n';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.util';

/**
 * Authentication Middleware
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      unauthorizedResponse(res, t('auth.token_required', {}, req.language));
      return;
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      unauthorizedResponse(res, t('auth.user_not_found', {}, req.language));
      return;
    }

    const credentials: AuthCredentials = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
      language: user.language,
    };

    req.user = credentials;

    next();
  } catch (_err) {
    unauthorizedResponse(res, t('auth.invalid_token', {}, req.language));
  }
};

/**
 * Permission Middleware Factory
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, t('auth.unauthorized', {}, req.language));
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      forbiddenResponse(res, t('auth.permission_denied', {}, req.language));
      return;
    }

    next();
  };
};

/**
 * Admin Only Middleware
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    unauthorizedResponse(res, t('auth.unauthorized', {}, req.language));
    return;
  }

  if (req.user.role !== 'admin') {
    forbiddenResponse(res, t('auth.permission_denied', {}, req.language));
    return;
  }

  next();
};

/**
 * Optional Authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      const credentials: AuthCredentials = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
        language: user.language,
      };

      req.user = credentials;
      req.language = user.language;
    }

    next();
  } catch (_err) {
    next();
  }
};

export default {
  authenticate,
  requirePermission,
  requireAdmin,
  optionalAuth,
};
