import Joi from 'joi';
import { Language } from '../types';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'validation.invalid_email',
    'any.required': 'validation.required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'validation.password_min',
    'any.required': 'validation.required',
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'validation.min_value',
    'string.max': 'validation.max_value',
    'any.required': 'validation.required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'validation.min_value',
    'string.max': 'validation.max_value',
    'any.required': 'validation.required',
  }),
  language: Joi.string()
    .valid(...Object.values(Language))
    .optional()
    .default(Language.EN),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'validation.invalid_email',
    'any.required': 'validation.required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'validation.required',
  }),
  rememberMe: Joi.boolean().optional().default(false),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'validation.required',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'validation.required',
    'string.empty': 'validation.required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'any.required': 'validation.required',
      'string.min': 'validation.password_min',
      'string.pattern.base': 'validation.password_strength',
    }),
});

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
};
