import { AuthCredentials, Language } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthCredentials;
      language?: Language;
    }
  }
}

export {};
