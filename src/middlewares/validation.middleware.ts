import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validationErrorResponse } from '../utils/response.util';
import { t } from '../config/i18n';
import { AuthRequest } from '../types';

type ValidationSource = 'body' | 'query' | 'params';

export const validate = (schema: Joi.ObjectSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[source];
    const language = (req as AuthRequest).language;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors: Record<string, string[]> = {};

      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        const messageKey = detail.message;

        const context = detail.context || {};

        const translationParams: Record<string, any> = {
          field: context.label || field,
        };

        if (context.limit !== undefined) {
          translationParams.min = context.limit;
          translationParams.max = context.limit;
        }

        if (context.valids && Array.isArray(context.valids)) {
          translationParams.values = context.valids.join(', ');
        }

        const translatedMessage = t(messageKey, translationParams, language);

        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(translatedMessage);
      });

      validationErrorResponse(res, t('common.bad_request', {}, language), errors);
      return;
    }

    if (source === 'query') {
      Object.keys(value).forEach((key) => {
        (req.query as any)[key] = value[key];
      });
    } else {
      req[source] = value;
    }

    next();
  };
};

export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');

export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');

export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
