import { Router } from 'express';
import { eventController, editLockController } from '../controllers';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { Permission } from '../types';
import {
  createEventSchema,
  updateEventSchema,
  eventIdSchema,
  queryEventsSchema,
} from '../validators';

const router = Router();

/**
 * @openapi
 * /api/v1/events:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get all events
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
 *           enum: [upcoming, active, ended]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *         description: Events retrieved successfully
 */
router.get('/', validateQuery(queryEventsSchema), eventController.getAllEvents);

/**
 * @openapi
 * /api/v1/events:
 *   post:
 *     tags:
 *       - Events
 *     summary: Create new event
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
 *               - title
 *               - description
 *               - startDate
 *               - endDate
 *               - maxVouchers
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               maxVouchers:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.EVENT_CREATE),
  validateBody(createEventSchema),
  eventController.createEvent
);

/**
 * @openapi
 * /api/v1/events/my-events:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get user's created events
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
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 */
router.get('/my-events', authenticate, eventController.getUserEvents);

/**
 * @openapi
 * /api/v1/events/{eventId}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get event by ID
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
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get('/:eventId', validateParams(eventIdSchema), eventController.getEventById);

/**
 * @openapi
 * /api/v1/events/{eventId}:
 *   put:
 *     tags:
 *       - Events
 *     summary: Update event
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.put(
  '/:eventId',
  authenticate,
  requirePermission(Permission.EVENT_UPDATE),
  validateParams(eventIdSchema),
  validateBody(updateEventSchema),
  eventController.updateEvent
);

/**
 * @openapi
 * /api/v1/events/{eventId}:
 *   delete:
 *     tags:
 *       - Events
 *     summary: Delete event
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
 *       204:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.delete(
  '/:eventId',
  authenticate,
  requirePermission(Permission.EVENT_DELETE),
  validateParams(eventIdSchema),
  eventController.deleteEvent
);

/**
 * @openapi
 * /api/v1/events/{eventId}/editable/me:
 *   post:
 *     tags:
 *       - Events
 *     summary: Acquire edit lock
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
 *         description: Lock acquired successfully
 *       409:
 *         description: Event is locked by another user
 */
router.post(
  '/:eventId/editable/me',
  authenticate,
  validateParams(eventIdSchema),
  editLockController.acquireLock
);

/**
 * @openapi
 * /api/v1/events/{eventId}/editable/release:
 *   post:
 *     tags:
 *       - Events
 *     summary: Release edit lock
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
 *         description: Lock released successfully
 */
router.post(
  '/:eventId/editable/release',
  authenticate,
  validateParams(eventIdSchema),
  editLockController.releaseLock
);

/**
 * @openapi
 * /api/v1/events/{eventId}/editable/maintain:
 *   post:
 *     tags:
 *       - Events
 *     summary: Maintain/extend edit lock
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
 *         description: Lock maintained successfully
 */
router.post(
  '/:eventId/editable/maintain',
  authenticate,
  validateParams(eventIdSchema),
  editLockController.maintainLock
);

export default router;
