import { User, Event, Voucher, RefreshToken } from '../../models';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util';
import { UserRole, Language, Permission } from '../../types';

/**
 * Create test user
 */
export const createTestUser = async (overrides?: Partial<any>) => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    language: Language.EN,
    isActive: true,
    permissions: [Permission.VOUCHER_ISSUE, Permission.VOUCHER_READ],
  };

  const user = await User.create({ ...defaultUser, ...overrides });
  return user;
};

/**
 * Create admin user
 */
export const createAdminUser = async () => {
  return await createTestUser({
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    permissions: Object.values(Permission),
  });
};

/**
 * Create manager user
 */
export const createManagerUser = async () => {
  return await createTestUser({
    email: 'manager@example.com',
    role: UserRole.MANAGER,
    permissions: [
      Permission.EVENT_CREATE,
      Permission.EVENT_READ,
      Permission.EVENT_UPDATE,
      Permission.VOUCHER_ISSUE,
      Permission.VOUCHER_READ,
      Permission.VOUCHER_READ_ALL,
    ],
  });
};

/**
 * Generate auth tokens for user
 */
export const generateAuthTokens = (user: any) => {
  const accessToken = generateAccessToken(user._id, user.email, user.role, user.permissions);
  const refreshToken = generateRefreshToken(user._id, user.email, user.role, user.permissions);

  return { accessToken, refreshToken };
};

/**
 * Create test event
 */
export const createTestEvent = async (createdBy: string, overrides?: Partial<any>) => {
  const defaultEvent = {
    title: 'Test Event',
    description: 'Test event description',
    startDate: new Date(Date.now() + 1000 * 60 * 60),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    maxVouchers: 100,
    issuedVouchers: 0,
    isActive: true,
    createdBy,
  };

  const event = await Event.create({ ...defaultEvent, ...overrides });
  return event;
};

/**
 * Create active event (currently running)
 */
export const createActiveEvent = async (createdBy: string) => {
  return await createTestEvent(createdBy, {
    startDate: new Date(Date.now() - 1000 * 60 * 60),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
};

/**
 * Create test voucher
 */
export const createTestVoucher = async (eventId: string, userId: string) => {
  const voucher = await Voucher.create({
    code: `TEST-${Date.now()}`,
    eventId,
    userId,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    isUsed: false,
  });

  return voucher;
};

/**
 * Create refresh token for user
 */
export const createRefreshToken = async (userId: string, token: string) => {
  return await RefreshToken.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
};

/**
 * Clean all test data
 */
export const cleanDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Voucher.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
};
