import { Response } from 'express';
import { AuthRequest } from '../types';
import { eventService } from '../services';
import {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  noContentResponse,
} from '../utils/response.util';
import { t } from '../config/i18n';

export class EventController {
  /**
   * Create new event
   */
  async createEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const event = await eventService.createEvent(req.body, req.user!.userId, req.language);

      createdResponse(res, t('event.created', {}, req.language), event);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get all events
   */
  async getAllEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await eventService.getEvents(req.query as any, req.language);

      successResponse(res, t('event.list_retrieved', {}, req.language), result);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = await eventService.getEventById(eventId, req.language);

      successResponse(res, t('event.detail_retrieved', {}, req.language), event);
    } catch (error) {
      notFoundResponse(res, (error as Error).message);
    }
  }

  /**
   * Update event
   */
  async updateEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = await eventService.updateEvent(
        eventId,
        req.body,
        req.user!.userId,
        req.language
      );

      successResponse(res, t('event.updated', {}, req.language), event);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      await eventService.deleteEvent(eventId, req.user!.userId, req.language);

      noContentResponse(res);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get user's created events
   */
  async getUserEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await eventService.getUserEvents(req.user!.userId, req.query as any);

      successResponse(res, t('event.list_retrieved', {}, req.language), result);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }
}

export default new EventController();
