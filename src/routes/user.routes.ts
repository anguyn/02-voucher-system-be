import { Router } from 'express';
import { userController } from '../controllers';
import { validateBody } from '../middlewares/validation.middleware';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import {
  updateUserRoleSchema,
  updateUserPermissionsSchema,
  toggleUserStatusSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminChangePasswordSchema,
} from '../validators';

const router = Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get all users (Admin)
 *     description: Get paginated list of all users with optional filters for search, role, and active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, first name, or last name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, manager, user]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [admin, manager, user]
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: string
 *                           language:
 *                             type: string
 *                             enum: [en, vi]
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin
 */
router.get('/', authenticate, requireAdmin, userController.getAllUsers);

/**
 * @openapi
 * /api/v1/users/{userId}:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get user by ID (Admin)
 *     description: Get detailed information of a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin
 *       404:
 *         description: User not found
 */
router.get('/:userId', authenticate, requireAdmin, userController.getUserById);

/**
 * @openapi
 * /api/v1/users/{userId}/role:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Update user role (Admin)
 *     description: Update user's role. Permissions will be automatically updated based on the new role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user]
 *                 example: manager
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId/role',
  authenticate,
  requireAdmin,
  validateBody(updateUserRoleSchema),
  userController.updateUserRole
);

/**
 * @openapi
 * /api/v1/users/{userId}/permissions:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Update user permissions (Admin)
 *     description: Set custom permissions for a user. This overrides role-based permissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum:
 *                     - event:create
 *                     - event:read
 *                     - event:update
 *                     - event:delete
 *                     - event:read:all
 *                     - voucher:issue
 *                     - voucher:read
 *                     - voucher:read:all
 *                     - voucher:use
 *                     - user:read
 *                     - user:update
 *                     - user:delete
 *                     - user:manage:roles
 *                     - system:settings
 *                 example: ["event:read", "voucher:issue", "voucher:read"]
 *     responses:
 *       200:
 *         description: User permissions updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId/permissions',
  authenticate,
  requireAdmin,
  validateBody(updateUserPermissionsSchema),
  userController.updateUserPermissions
);

/**
 * @openapi
 * /api/v1/users/{userId}/status:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Activate or deactivate user (Admin)
 *     description: Toggle user's active status. Deactivating a user will logout them from all devices.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId/status',
  authenticate,
  requireAdmin,
  validateBody(toggleUserStatusSchema),
  userController.toggleUserStatus
);

/**
 * @openapi
 * /api/v1/users/{userId}/password:
 *   patch:
 *     tags:
 *       - User Management
 *     summary: Admin change user password (Admin)
 *     description: Change a user's password without requiring their current password. The user will be logged out from all devices. Admins cannot use this route to change their own password.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: Newpassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot change own password via this route
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId/password',
  authenticate,
  requireAdmin,
  validateBody(adminChangePasswordSchema),
  userController.adminChangePassword
);

/**
 * @openapi
 * /api/v1/users/{userId}:
 *   delete:
 *     tags:
 *       - User Management
 *     summary: Delete user (Admin)
 *     description: Permanently delete a user and all their refresh tokens. Admins cannot delete themselves.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot delete yourself
 *       404:
 *         description: User not found
 */
router.delete('/:userId', authenticate, requireAdmin, userController.deleteUser);

/**
 * @openapi
 * /api/v1/users/me/profile:
 *   patch:
 *     tags:
 *       - User Profile
 *     summary: Update own profile
 *     description: Update authenticated user's profile information (first name, last name, language)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               language:
 *                 type: string
 *                 enum: [en, vi]
 *                 example: en
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/me/profile',
  authenticate,
  validateBody(updateProfileSchema),
  userController.updateProfile
);

/**
 * @openapi
 * /api/v1/users/me/password:
 *   patch:
 *     tags:
 *       - User Profile
 *     summary: Change own password
 *     description: Change authenticated user's password. Requires current password. User will be logged out from all devices after password change.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: CurrentPass123!
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: Newpassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or current password incorrect
 */
router.patch(
  '/me/password',
  authenticate,
  validateBody(changePasswordSchema),
  userController.changePassword
);

export default router;
