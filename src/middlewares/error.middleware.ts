import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { t } from '../config/i18n';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  const language = authReq.language;

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: t('common.bad_request', {}, language),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(409).json({
      success: false,
      message: t('common.conflict', {}, language),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: t('auth.invalid_token', {}, language),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? t('common.internal_error', {}, language) : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const authReq = req as AuthRequest;
  const language = authReq.language;

  res.status(404).json({
    success: false,
    message: t('common.not_found', {}, language),
    path: req.path,
  });
};

export default {
  errorHandler,
  notFoundHandler,
};
