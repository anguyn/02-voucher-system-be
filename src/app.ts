import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { apiReference } from '@scalar/express-api-reference';
import healthRoutes from './routes/health.routes';
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// ==================== MIDDLEWARES ====================

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Voucher System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      documentation: {
        scalar: '/docs',
        swagger: '/api-docs',
        openapi: '/openapi.json',
      },
    },
  });
});

// Health check routes
app.use('/health', healthRoutes);

// ==================== API DOCUMENTATION ====================

// OpenAPI JSON endpoint
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Scalar Documentation (Modern UI)
app.use(
  '/docs',
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: 'purple',
    darkMode: true,
    layout: 'modern',
    metaData: {
      title: 'Voucher System API Documentation',
      description: 'Complete API reference with interactive examples',
    },
  })
);

// Swagger UI Documentation (Traditional)
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Voucher System API',
    customfavIcon: '/favicon.ico',
  })
);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
