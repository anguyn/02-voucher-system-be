import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const swaggerDefinition = {
  openapi: '3.1.0',
  info: {
    title: 'Voucher System API',
    version: '1.0.0',
    description: 'Complete API documentation for Voucher & Events Management System',
    contact: {
      name: 'API Support',
      email: 'support@vouchersystem.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://${HOST}:${PORT}`,
      description: 'Development server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
    {
      name: 'Events',
      description: 'Event management endpoints',
    },
    {
      name: 'Vouchers',
      description: 'Voucher management endpoints',
    },
    {
      name: 'Users',
      description: 'User profile management',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          error: {
            type: 'string',
            example: 'Detailed error information',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Server is running!',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          uptime: {
            type: 'number',
            example: 123.45,
          },
          environment: {
            type: 'string',
            example: 'development',
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
