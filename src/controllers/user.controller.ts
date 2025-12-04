import { Response } from 'express';
import { AuthRequest } from '../types';
import { userService } from '../services';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from '../utils/response.util';
import { t } from '../config/i18n';

export class UserController {
  /**
   * Get all users (Admin)
   */
  getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;

      const filters = {
        search: search as string,
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const result = await userService.getAllUsers(Number(page), Number(limit), filters);

      successResponse(res, t('user.users_retrieved', {}, req.language), result);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Get user by ID (Admin)
   */
  getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);

      if (!user) {
        notFoundResponse(res, t('user.not_found', {}, req.language));
        return;
      }

      successResponse(res, t('user.user_retrieved', {}, req.language), user);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Update user role (Admin)
   */
  updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await userService.updateUserRole(userId, role, req.language);

      successResponse(res, t('user.role_updated', {}, req.language), user);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Update user permissions (Admin)
   */
  updateUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      const user = await userService.updateUserPermissions(userId, permissions, req.language);

      successResponse(res, t('user.permissions_updated', {}, req.language), user);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Activate/Deactivate user (Admin)
   */
  toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await userService.toggleUserStatus(userId, isActive, req.language);

      successResponse(
        res,
        isActive
          ? t('user.account_activated', {}, req.language)
          : t('user.account_deactivated', {}, req.language),
        user
      );
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Update own profile
   */
  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, language } = req.body;

      const user = await userService.updateProfile(
        req.user!.userId,
        { firstName, lastName, language },
        req.language
      );

      successResponse(res, t('user.profile_updated', {}, req.language), user);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Change own password
   */
  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(
        req.user!.userId,
        currentPassword,
        newPassword,
        req.language
      );

      successResponse(res, t('user.password_changed', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Admin change user password (Admin)
   */
  adminChangePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (userId === req.user!.userId) {
        forbiddenResponse(res, t('user.cannot_change_own_password_as_admin', {}, req.language));
        return;
      }

      await userService.adminChangePassword(userId, newPassword, req.language);

      successResponse(res, t('user.password_changed', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };

  /**
   * Delete user (Admin)
   */
  deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.userId) {
        forbiddenResponse(res, t('user.cannot_delete_yourself', {}, req.language));
        return;
      }

      await userService.deleteUser(userId, req.language);

      successResponse(res, t('user.user_deleted', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  };
}

export default new UserController();
