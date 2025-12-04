import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import RedisMock from 'ioredis-mock';

// ==================== ENVIRONMENT SETUP ====================
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.RESEND_API_KEY = 're_test_mock_api_key';
process.env.FROM_EMAIL = 'test@example.com';
process.env.FROM_NAME = 'Test System';

// ==================== MOCK ESM MODULES ====================

jest.mock('@scalar/express-api-reference', () => ({
  apiReference: jest.fn(() => (_req: any, res: any) => {
    res.send('Mocked Scalar Documentation');
  }),
}));

let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    mockUuidCounter++;
    return `test-uuid-${mockUuidCounter.toString().padStart(4, '0')}`;
  }),
  v1: jest.fn(() => 'test-uuid-v1-1234-5678'),
  v3: jest.fn(() => 'test-uuid-v3-1234-5678'),
  v5: jest.fn(() => 'test-uuid-v5-1234-5678'),
}));

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({
          id: 'test-email-id-123',
          from: 'test@example.com',
          to: 'recipient@example.com',
        }),
      },
    })),
  };
});

// ==================== MOCK APPLICATION MODULES ====================

jest.mock('../config/redis', () => {
  const createMockRedis = () => {
    const store = new Map();

    return {
      get: jest.fn(async (key: string) => store.get(key) || null),
      set: jest.fn(async (key: string, value: string, ...args: any[]) => {
        store.set(key, value);
        return 'OK';
      }),
      setex: jest.fn(async (key: string, seconds: number, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      incr: jest.fn(async (key: string) => {
        const val = parseInt(store.get(key) || '0', 10) + 1;
        store.set(key, val.toString());
        return val;
      }),
      expire: jest.fn(async () => 1),
      ttl: jest.fn(async () => 3600),
      exists: jest.fn(async (key: string) => (store.has(key) ? 1 : 0)),
      keys: jest.fn(async (pattern: string) => Array.from(store.keys())),
      flushall: jest.fn(async () => {
        store.clear();
        return 'OK';
      }),
      script: jest.fn(() => ({
        load: jest.fn(async () => 'mock-sha'),
        exists: jest.fn(async () => [1]),
      })),
      evalsha: jest.fn(async () => [0, 1]),
      eval: jest.fn(async () => [0, 1]),
      ping: jest.fn(async () => 'PONG'),
      quit: jest.fn(async () => 'OK'),
      disconnect: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
    };
  };

  const mockRedis = createMockRedis();

  return {
    redisClient: mockRedis,
    redis: mockRedis,
    checkRedisConnection: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('../middlewares/rate-limit.middleware', () => ({
  apiLimiter: (_req: any, _res: any, next: any) => next(),
  authLimiter: (_req: any, _res: any, next: any) => next(),
  voucherLimiter: (_req: any, _res: any, next: any) => next(),
  default: {
    apiLimiter: (_req: any, _res: any, next: any) => next(),
    authLimiter: (_req: any, _res: any, next: any) => next(),
    voucherLimiter: (_req: any, _res: any, next: any) => next(),
  },
}));

jest.mock('../queues/email.queue', () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

// ==================== DATABASE SETUP ====================

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  console.log('✅ Test database connected');
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  jest.clearAllMocks();

  mockUuidCounter = 0;
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log('✅ Test database disconnected');
});

// ==================== GLOBAL TEST CONFIG ====================

jest.setTimeout(30000);

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};
