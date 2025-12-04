import Joi from 'joi';
import { UserRole, Permission, Language } from '../types';

export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .required()
    .messages({
      'any.required': 'validation.required',
      'any.only': 'validation.invalid_role',
      'string.empty': 'validation.required',
    }),
});

export const updateUserPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid(...Object.values(Permission)))
    .min(1)
    .required()
    .messages({
      'array.min': 'validation.permissions_min',
      'any.required': 'validation.required',
      'any.only': 'validation.invalid_permission',
    }),
});

export const toggleUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'validation.required',
    'boolean.base': 'validation.invalid_boolean',
  }),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().messages({
    'string.min': 'validation.min_length',
    'string.max': 'validation.max_length',
  }),
  lastName: Joi.string().min(2).max(50).trim().messages({
    'string.min': 'validation.min_length',
    'string.max': 'validation.max_length',
  }),
  language: Joi.string()
    .valid(...Object.values(Language))
    .messages({
      'any.only': 'validation.invalid_language',
    }),
})
  .min(1)
  .messages({
    'object.min': 'validation.at_least_one_field',
  });

export const adminChangePasswordSchema = Joi.object({
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
  updateUserRoleSchema,
  updateUserPermissionsSchema,
  toggleUserStatusSchema,
  updateProfileSchema,
  adminChangePasswordSchema,
};
