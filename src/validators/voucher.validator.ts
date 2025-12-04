import Joi from 'joi';

export const issueVoucherSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'validation.invalid_id',
    'string.length': 'validation.invalid_id',
    'any.required': 'validation.required',
  }),
});

export const useVoucherSchema = Joi.object({
  code: Joi.string().uppercase().length(12).required().messages({
    'string.length': 'validation.invalid_value',
    'any.required': 'validation.required',
  }),
});

export const queryVouchersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  eventId: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('available', 'used', 'expired').optional(),
  sortBy: Joi.string().valid('issuedAt', 'expiresAt', 'createdAt').optional().default('issuedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});

export default {
  issueVoucherSchema,
  useVoucherSchema,
  queryVouchersSchema,
};
