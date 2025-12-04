import { authService } from '../../services';
import { User, RefreshToken } from '../../models';
import { UserRole, Language } from '../../types';
import { createTestUser, generateAuthTokens } from '../helpers/test-utils';
import { verifyRefreshToken } from '../../utils/jwt.util';

describe('AuthService', () => {
  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
        language: Language.EN,
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.role).toBe(UserRole.USER);

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user?.isActive).toBe(true);
    });

    it('should hash password correctly', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'User',
        language: Language.EN,
      };

      await authService.register(userData);

      const user = await User.findOne({ email: userData.email }).select('+password');
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password.length).toBeGreaterThan(50);
    });

    it('should throw error if email already exists', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const userData = {
        email: 'existing@example.com',
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'User',
        language: Language.EN,
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });

    it('should set default language to EN if not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await authService.register(userData as any);

      expect(result.user.language).toBe(Language.EN);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const password = 'Password@123';
      const user = await createTestUser({
        email: 'login@example.com',
        password,
      });

      const result = await authService.login({
        email: 'login@example.com',
        password,
        rememberMe: false,
      });

      expect(result.user.email).toBe(user.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      const refreshToken = await RefreshToken.findOne({ userId: user._id });
      expect(refreshToken).toBeTruthy();
    });

    it('should update lastLoginAt on successful login', async () => {
      const password = 'Password@123';
      const user = await createTestUser({
        email: 'login@example.com',
        password,
      });

      const beforeLogin = user.lastLoginAt;

      await authService.login({
        email: 'login@example.com',
        password,
        rememberMe: false,
      });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.lastLoginAt).not.toEqual(beforeLogin);
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should throw error with incorrect password', async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'Password@123',
      });

      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'WrongPassword@123',
          rememberMe: false,
        })
      ).rejects.toThrow();
    });

    it('should throw error with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password@123',
          rememberMe: false,
        })
      ).rejects.toThrow();
    });

    it('should throw error for inactive user', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        password: 'Password@123',
        isActive: false,
      });

      await expect(
        authService.login({
          email: 'inactive@example.com',
          password: 'Password@123',
          rememberMe: false,
        })
      ).rejects.toThrow();
    });

    it('should generate longer expiry for rememberMe', async () => {
      const password = 'Password@123';
      await createTestUser({
        email: 'remember@example.com',
        password,
      });

      const result1 = await authService.login({
        email: 'remember@example.com',
        password,
        rememberMe: false,
      });

      const token1 = await RefreshToken.findOne({ token: result1.tokens.refreshToken });

      await RefreshToken.deleteMany({});

      const result2 = await authService.login({
        email: 'remember@example.com',
        password,
        rememberMe: true,
      });

      const token2 = await RefreshToken.findOne({ token: result2.tokens.refreshToken });

      expect(token2!.expiresAt.getTime()).toBeGreaterThan(token1!.expiresAt.getTime());
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthTokens(user);

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken);

      const oldToken = await RefreshToken.findOne({ token: refreshToken });
      expect(oldToken).toBeNull();

      const newToken = await RefreshToken.findOne({ token: result.refreshToken });
      expect(newToken).toBeTruthy();
    });

    it('should throw error with invalid token', async () => {
      await expect(authService.refreshAccessToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error if token not in database', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthTokens(user);

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow();
    });

    it('should throw error if token is expired', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthTokens(user);

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60),
      });

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow();
    });

    it('should throw error if user is inactive', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthTokens(user);

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      user.isActive = false;
      await user.save();

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should delete specific refresh token', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthTokens(user);

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      await authService.logout(user._id.toString(), refreshToken);

      const token = await RefreshToken.findOne({ token: refreshToken });
      expect(token).toBeNull();
    });

    it('should not affect other tokens', async () => {
      const user = await createTestUser();

      const token1 = 'token1';
      const token2 = 'token2';

      await RefreshToken.create([
        {
          userId: user._id,
          token: token1,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          userId: user._id,
          token: token2,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      ]);

      await authService.logout(user._id.toString(), token1);

      const remainingToken = await RefreshToken.findOne({ token: token2 });
      expect(remainingToken).toBeTruthy();
    });
  });

  describe('logoutAll', () => {
    it('should delete all user refresh tokens', async () => {
      const user = await createTestUser();

      await RefreshToken.create([
        {
          userId: user._id,
          token: 'token1',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          userId: user._id,
          token: 'token2',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          userId: user._id,
          token: 'token3',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      ]);

      await authService.logoutAll(user._id.toString());

      const tokens = await RefreshToken.find({ userId: user._id });
      expect(tokens).toHaveLength(0);
    });

    it('should not affect other users tokens', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });

      await RefreshToken.create([
        {
          userId: user1._id,
          token: 'user1-token',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          userId: user2._id,
          token: 'user2-token',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      ]);

      await authService.logoutAll(user1._id.toString());

      const user1Tokens = await RefreshToken.find({ userId: user1._id });
      const user2Tokens = await RefreshToken.find({ userId: user2._id });

      expect(user1Tokens).toHaveLength(0);
      expect(user2Tokens).toHaveLength(1);
    });
  });

  describe('getActiveRefreshTokens', () => {
    it('should return only active (non-expired) tokens', async () => {
      const user = await createTestUser();

      await RefreshToken.create([
        {
          userId: user._id,
          token: 'active-token',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        {
          userId: user._id,
          token: 'expired-token',
          expiresAt: new Date(Date.now() - 1000 * 60 * 60),
        },
      ]);

      const tokens = await authService.getActiveRefreshTokens(user._id.toString());

      expect(tokens).toHaveLength(1);
      expect(tokens[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return empty array if no active tokens', async () => {
      const user = await createTestUser();

      const tokens = await authService.getActiveRefreshTokens(user._id.toString());

      expect(tokens).toHaveLength(0);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke specific token by ID', async () => {
      const user = await createTestUser();

      const tokenDoc = await RefreshToken.create({
        userId: user._id,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      await authService.revokeRefreshToken(user._id.toString(), tokenDoc._id.toString());

      const token = await RefreshToken.findById(tokenDoc._id);
      expect(token).toBeNull();
    });

    it('should not revoke token of different user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });

      const tokenDoc = await RefreshToken.create({
        userId: user1._id,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      await authService.revokeRefreshToken(user2._id.toString(), tokenDoc._id.toString());

      const token = await RefreshToken.findById(tokenDoc._id);
      expect(token).toBeTruthy();
    });
  });
});
