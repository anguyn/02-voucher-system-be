import { Response } from 'express';
import { AuthRequest } from '../types';
import { authService } from '../services';
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
} from '../utils/response.util';
import { t } from '../config/i18n';
import { emailQueue } from '../queues/email.queue';

export class AuthController {
  /**
   * Register new user
   */
  register = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { user } = await authService.register(req.body, req.language);

      await emailQueue.add('send-welcome-email', {
        email: user.email,
        firstName: user.firstName,
        language: user.language,
      });

      createdResponse(res, t('auth.register_success', {}, req.language), {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Login user
   */
  login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await authService.login(req.body, req.language);
      const { accessToken, refreshToken } = result.tokens;

      this.setAuthCookies(res, accessToken, refreshToken);

      successResponse(res, t('auth.login_success', {}, req.language), {
        user: result.user,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      unauthorizedResponse(res, (error as Error).message);
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new Error(t('auth.refresh_token_required', {}, req.language));
      }

      const tokens = await authService.refreshAccessToken(refreshToken, req.language);

      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      successResponse(res, t('auth.token_refreshed', {}, req.language), tokens);
    } catch (error) {
      unauthorizedResponse(res, (error as Error).message);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(req.user!.userId, refreshToken);
      }

      this.clearAuthCookies(res);

      successResponse(res, t('auth.logout_success', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Logout from all devices
   */
  logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await authService.logoutAll(req.user!.userId);

      this.clearAuthCookies(res);

      successResponse(res, t('auth.logout_all_success', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      successResponse(res, t('user.profile_retrieved', {}, req.language), req.user);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Get all refresh tokens for current user
   */
  getRefreshTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokens = await authService.getActiveRefreshTokens(req.user!.userId);

      successResponse(res, t('user.refresh_tokens_retrieved', {}, req.language), tokens);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Revoke specific refresh token
   */
  revokeRefreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { tokenId } = req.params;
      await authService.revokeRefreshToken(req.user!.userId, tokenId);

      successResponse(res, t('user.refresh_token_revoked', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Set authentication cookies
   */
  private setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  };

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies = (res: Response): void => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  };
}

export default new AuthController();
