import { Router } from 'express';
import { voucherController } from '../controllers';
import { validateBody, validateQuery } from '../middlewares/validation.middleware';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { voucherLimiter } from '../middlewares/rate-limit.middleware';
import { Permission } from '../types';
import { issueVoucherSchema, useVoucherSchema, queryVouchersSchema } from '../validators';

const router = Router();

/**
 * @openapi
 * /api/v1/vouchers/issue:
 *   post:
 *     tags:
 *       - Vouchers
 *     summary: Issue voucher for an event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Voucher issued successfully
 *       456:
 *         description: No vouchers available
 *       409:
 *         description: User already claimed voucher for this event
 */
router.post(
  '/issue',
  authenticate,
  requirePermission(Permission.VOUCHER_ISSUE),
  voucherLimiter,
  validateBody(issueVoucherSchema),
  voucherController.issueVoucher
);

/**
 * @openapi
 * /api/v1/vouchers/use:
 *   post:
 *     tags:
 *       - Vouchers
 *     summary: Use/redeem a voucher
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voucher used successfully
 *       400:
 *         description: Invalid voucher code or already used
 */
router.post(
  '/use',
  authenticate,
  requirePermission(Permission.VOUCHER_USE),
  validateBody(useVoucherSchema),
  voucherController.useVoucher
);

/**
 * @openapi
 * /api/v1/vouchers/my-vouchers:
 *   get:
 *     tags:
 *       - Vouchers
 *     summary: Get user's vouchers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, used, expired]
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     responses:
 *       200:
 *         description: Vouchers retrieved successfully
 */
router.get(
  '/my-vouchers',
  authenticate,
  requirePermission(Permission.VOUCHER_READ),
  validateQuery(queryVouchersSchema),
  voucherController.getUserVouchers
);

/**
 * @openapi
 * /api/v1/vouchers/{code}:
 *   get:
 *     tags:
 *       - Vouchers
 *     summary: Get voucher by code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     responses:
 *       200:
 *         description: Voucher retrieved successfully
 *       404:
 *         description: Voucher not found
 */
router.get(
  '/:code',
  authenticate,
  requirePermission(Permission.VOUCHER_READ),
  voucherController.getVoucherByCode
);

/**
 * @openapi
 * /api/v1/vouchers/stats/{eventId}:
 *   get:
 *     tags:
 *       - Vouchers
 *     summary: Get event voucher statistics (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [en, vi]
 *           default: en
 *         required: false
 *         description: Set the response language
 *         example: en
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 */
router.get(
  '/stats/:eventId',
  authenticate,
  requirePermission(Permission.VOUCHER_READ_ALL),
  voucherController.getEventStats
);

export default router;
