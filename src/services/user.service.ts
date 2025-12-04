import { User, RefreshToken } from '../models';
import { UserRole, Permission, Language, UserResponse, ROLE_PERMISSIONS } from '../types';
import { t } from '../config/i18n';

interface GetAllUsersFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
}

interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  language?: Language;
}

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(page: number, limit: number, filters: GetAllUsersFilters) {
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.formatUserResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return null;
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user role (also updates permissions based on role)
   */
  async updateUserRole(userId: string, role: UserRole, language?: Language): Promise<UserResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    user.role = role;
    user.permissions = ROLE_PERMISSIONS[role];

    await user.save();

    return this.formatUserResponse(user);
  }

  /**
   * Update user permissions (custom permissions override role defaults)
   */
  async updateUserPermissions(
    userId: string,
    permissions: Permission[],
    language?: Language
  ): Promise<UserResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    user.permissions = permissions;
    await user.save();

    return this.formatUserResponse(user);
  }

  /**
   * Activate or deactivate user
   */
  async toggleUserStatus(
    userId: string,
    isActive: boolean,
    language?: Language
  ): Promise<UserResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    user.isActive = isActive;
    await user.save();

    if (!isActive) {
      await RefreshToken.deleteMany({ userId });
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user profile (firstName, lastName, language)
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDTO,
    language?: Language
  ): Promise<UserResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.language) user.language = data.language;

    await user.save();

    return this.formatUserResponse(user);
  }

  /**
   * Change password (requires current password)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    language?: Language
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error(t('user.current_password_incorrect', {}, language));
    }

    user.password = newPassword;
    await user.save();

    await RefreshToken.deleteMany({ userId });
  }

  /**
   * Admin change user password (no current password required)
   */
  async adminChangePassword(
    userId: string,
    newPassword: string,
    language?: Language
  ): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    user.password = newPassword;
    await user.save();

    await RefreshToken.deleteMany({ userId });
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, language?: Language): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(t('user.not_found', {}, language));
    }

    await RefreshToken.deleteMany({ userId });

    await User.deleteOne({ _id: userId });
  }

  /**
   * Format user response (remove sensitive data)
   */
  private formatUserResponse(user: any): UserResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      language: user.language,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}

export default new UserService();
