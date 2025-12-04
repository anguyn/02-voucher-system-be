import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { apiReference } from '@scalar/express-api-reference';
import healthRoutes from './routes/health.routes';
import { swaggerSpec } from './config/swagger';
import corsOptions from './config/cors';
import { localeMiddleware } from './middlewares/locale.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { loadEnv } from './config/env';

loadEnv();

const app: Application = express();

// ==================== SECURITY MIDDLEWARES ====================

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:', '*'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
        'style-src': ["'self'", "'unsafe-inline'", '*'],
        'font-src': ["'self'", 'data:', '*'],
        'connect-src': ["'self'", '*'],
        'media-src': ["'self'", '*'],
        'frame-src': ["'self'", '*'],
      },
    },
    crossOriginResourcePolicy: false,
  })
);

app.use(cors(corsOptions));

// ==================== HEADER & BODY PARSER ====================

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== LOCALE MIDDLEWARE ====================

app.use(localeMiddleware);

// ==================== REQUEST LOGGING ====================

if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ==================== ROUTES ====================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Voucher System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      api: '/api/v1',
      documentation: {
        scalar: '/docs',
        swagger: '/api-docs',
        openapi: '/openapi.json',
      },
    },
  });
});

app.use('/health', healthRoutes);

import apiRoutes from './routes';
app.use('/api/v1', apiRoutes);

// ==================== API DOCUMENTATION ====================

app.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Voucher System API',
  })
);

// ==================== ERROR HANDLING ====================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
