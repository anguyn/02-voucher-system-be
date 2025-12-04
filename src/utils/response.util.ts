import { Response } from 'express';
import { ApiResponse } from '../types';

export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };

  return res.status(statusCode).json(response);
};

export const createdResponse = <T>(res: Response, message: string, data?: T): Response => {
  return successResponse(res, message, data, 201);
};

export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

export const unauthorizedResponse = (res: Response, message: string = 'Unauthorized'): Response => {
  return errorResponse(res, message, undefined, 401);
};

export const forbiddenResponse = (res: Response, message: string = 'Forbidden'): Response => {
  return errorResponse(res, message, undefined, 403);
};

export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, message, undefined, 404);
};

export const conflictResponse = (res: Response, message: string = 'Conflict'): Response => {
  return errorResponse(res, message, undefined, 409);
};

export const validationErrorResponse = (
  res: Response,
  message: string,
  errors?: Record<string, string[]>
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };

  return res.status(422).json(response);
};

export const customErrorResponse = (
  res: Response,
  message: string,
  statusCode: number
): Response => {
  return errorResponse(res, message, undefined, statusCode);
};

export default {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  customErrorResponse,
};
