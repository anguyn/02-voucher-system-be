import Joi from 'joi';

export const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'validation.min_value',
    'string.max': 'validation.max_value',
    'string.base': 'validation.required',
    'any.required': 'validation.required',
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    'string.min': 'validation.min_value',
    'string.max': 'validation.max_value',
    'string.base': 'validation.required',
    'any.required': 'validation.required',
  }),
  startDate: Joi.date().iso().greater('now').required().messages({
    'date.base': 'validation.invalid_date',
    'date.greater': 'validation.future_date',
    'any.required': 'validation.required',
  }),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
    'date.base': 'validation.invalid_date',
    'date.greater': 'validation.end_after_start',
    'any.required': 'validation.required',
  }),
  maxVouchers: Joi.number().integer().min(1).max(100000).required().messages({
    'number.base': 'validation.required',
    'number.min': 'validation.min_value',
    'number.max': 'validation.max_value',
    'any.required': 'validation.required',
  }),
  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'validation.invalid_boolean',
  }),
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    'string.min': 'validation.min_value',
    'string.max': 'validation.max_value',
  }),
  description: Joi.string().min(10).max(2000).optional().messages({
    'string.min': 'validation.min_value',
    'string.max': 'validation.max_value',
  }),
  startDate: Joi.date().iso().optional().messages({
    'date.base': 'validation.invalid_date',
  }),
  endDate: Joi.date()
    .iso()
    .when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
      otherwise: Joi.date(),
    })
    .optional()
    .messages({
      'date.base': 'validation.invalid_date',
      'date.greater': 'validation.end_after_start',
    }),
  maxVouchers: Joi.number().integer().min(1).max(100000).optional().messages({
    'number.base': 'validation.required',
    'number.min': 'validation.min_value',
    'number.max': 'validation.max_value',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'validation.invalid_boolean',
  }),
})
  .min(1)
  .messages({
    'object.min': 'validation.at_least_one_field',
  });

export const eventIdSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'validation.invalid_id',
    'string.length': 'validation.invalid_id',
    'any.required': 'validation.required',
  }),
});

export const queryEventsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'validation.required',
    'number.min': 'validation.min_value',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'validation.required',
    'number.min': 'validation.min_value',
    'number.max': 'validation.max_value',
  }),
  status: Joi.string().valid('upcoming', 'active', 'ended').optional().messages({
    'any.only': 'validation.invalid_enum',
  }),
  sortBy: Joi.string()
    .valid('createdAt', 'startDate', 'endDate', 'title')
    .optional()
    .default('createdAt')
    .messages({
      'any.only': 'validation.invalid_enum',
    }),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc').messages({
    'any.only': 'validation.invalid_enum',
  }),
});

export default {
  createEventSchema,
  updateEventSchema,
  eventIdSchema,
  queryEventsSchema,
};
