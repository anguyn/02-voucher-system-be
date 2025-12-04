import { Request, Response, NextFunction } from 'express';
import { changeLanguage } from '../config/i18n';
import { Language, AuthRequest } from '../types';

/**
 * Locale Middleware
 * Detects and sets language from:
 * 1. Query parameter ?lang=en
 * 2. User preference (if authenticated)
 * 3. Accept-Language header
 * 4. Default language (en)
 */
export const localeMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let detectedLanguage: Language = Language.EN;
    const authReq = req as AuthRequest;

    console.log('Ra 2: ', authReq.user);
    if (req.query.lang) {
      console.log('Case 1');
      const queryLang = req.query.lang as string;
      if (Object.values(Language).includes(queryLang as Language)) {
        detectedLanguage = queryLang as Language;
      }
    } else if (authReq.user && authReq.user.language) {
      console.log('Case 2');
      detectedLanguage = authReq.user.language;
    } else if (req.headers['accept-language']) {
      console.log('Case 3');
      const acceptLanguage = req.headers['accept-language'].split(',')[0].split('-')[0];
      if (Object.values(Language).includes(acceptLanguage as Language)) {
        detectedLanguage = acceptLanguage as Language;
      }
    } else {
      console.log('Case 4');
      const defaultLang = process.env.DEFAULT_LANGUAGE || 'en';
      if (Object.values(Language).includes(defaultLang as Language)) {
        detectedLanguage = defaultLang as Language;
      }
    }

    authReq.language = detectedLanguage;
    await changeLanguage(detectedLanguage);

    next();
  } catch (_error) {
    const authReq = req as AuthRequest;
    authReq.language = Language.EN;
    await changeLanguage(Language.EN);
    next();
  }
};

export default localeMiddleware;
