import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Basic health check
 *     description: Returns basic server health status
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check
 * @access  Public
 */

/**
 * @openapi
 * /health/detailed:
 *   get:
 *     tags:
 *       - Health
 *     summary: Detailed health check
 *     description: Returns detailed server health information including system metrics
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 *                 system:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     nodeVersion:
 *                       type: string
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 */
router.get('/detailed', (_req: Request, res: Response) => {
  const healthInfo = {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      },
      cpu: process.cpuUsage(),
    },
  };

  res.status(200).json(healthInfo);
});

export default router;
