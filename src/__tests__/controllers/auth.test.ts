import request from 'supertest';
import app from '../../app';
import { User, RefreshToken } from '../../models';
import { createTestUser, generateAuthTokens } from '../helpers/test-utils';

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password@123',
        firstName: 'New',
        lastName: 'User',
        language: 'en',
      };

      const res = await request(app).post('/api/v1/auth/register').send(userData).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.firstName).toBe(userData.firstName);

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(userData.email);
    });

    it('should fail if email already exists', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'Password@123',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password@123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('login@example.com');

      expect(res.headers['set-cookie']).toBeDefined();

      const refreshToken = await RefreshToken.findOne({ userId: user._id });
      expect(refreshToken).toBeTruthy();
    });

    it('should fail with incorrect password', async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'Password@123',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should fail for inactive user', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        password: 'Password@123',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'Password@123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data.id).toBe(user._id.toString());
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/v1/auth/profile').expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const { accessToken, refreshToken } = generateAuthTokens(user);

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);

      const token = await RefreshToken.findOne({ token: refreshToken });
      expect(token).toBeNull();
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    it('should logout from all devices', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

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
      ]);

      const res = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const tokens = await RefreshToken.find({ userId: user._id });
      expect(tokens).toHaveLength(0);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthTokens(user);

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      const oldToken = await RefreshToken.findOne({ token: refreshToken });
      expect(oldToken).toBeNull();

      const newToken = await RefreshToken.findOne({
        token: res.body.data.refreshToken,
      });
      expect(newToken).toBeTruthy();
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
