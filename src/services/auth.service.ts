import { User, RefreshToken } from '../models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.util';
import {
  RegisterDTO,
  LoginDTO,
  LoginResponse,
  UserResponse,
  AuthTokens,
  Language,
  UserRole,
} from '../types';
import { t } from '../config/i18n';

export class AuthService {
  async register(data: RegisterDTO, language?: Language): Promise<Pick<LoginResponse, 'user'>> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error(t('auth.email_exists', {}, language));
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.USER,
      language: data.language,
    });

    const userResponse: UserResponse = {
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

    return {
      user: userResponse,
    };
  }

  async login(data: LoginDTO, language?: Language): Promise<LoginResponse> {
    const user = await User.findOne({ email: data.email }).select('+password');

    if (!user || !user.isActive) {
      throw new Error(t('auth.invalid_credentials', {}, language));
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new Error(t('auth.invalid_credentials', {}, language));
    }

    const accessToken = generateAccessToken(user._id, user.email, user.role, user.permissions);
    const refreshToken = generateRefreshToken(
      user._id,
      user.email,
      user.role,
      user.permissions,
      data.rememberMe
    );

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(data.rememberMe),
    });

    user.lastLoginAt = new Date();
    await user.save();

    const userResponse: UserResponse = {
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

    return {
      user: userResponse,
      tokens: { accessToken, refreshToken },
    };
  }

  async refreshAccessToken(token: string, language?: Language): Promise<AuthTokens> {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new Error(t('auth.invalid_refresh_token', {}, language));
    }

    const storedToken = await RefreshToken.findOne({
      token,
      userId: decoded.userId,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error(t('auth.invalid_refresh_token', {}, language));
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error(t('auth.user_not_found', {}, language));
    }

    await RefreshToken.deleteOne({ token });

    const newAccessToken = generateAccessToken(user._id, user.email, user.role, user.permissions);
    const newRefreshToken = generateRefreshToken(user._id, user.email, user.role, user.permissions);

    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt: getRefreshTokenExpiry(false),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, token: string): Promise<void> {
    await RefreshToken.deleteOne({ userId, token });
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }

  async getActiveRefreshTokens(userId: string) {
    const tokens = await RefreshToken.find({
      userId,
      expiresAt: { $gt: new Date() },
    }).select('_id createdAt expiresAt deviceInfo ipAddress');

    return tokens;
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await RefreshToken.deleteOne({ _id: tokenId, userId });
  }
}

export default new AuthService();
