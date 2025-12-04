import { Types } from 'mongoose';
import { Event, Voucher } from '../models';
import {
  CreateEventDTO,
  UpdateEventDTO,
  PaginatedResponse,
  PaginationParams,
  Language,
} from '../types';
import { t } from '../config/i18n';

export class EventService {
  /**
   * Create new event
   */
  async createEvent(data: CreateEventDTO, userId: string, _language?: Language) {
    const event = await Event.create({
      ...data,
      createdBy: new Types.ObjectId(userId),
    });

    return event;
  }

  /**
   * Get all events with pagination
   */
  async getEvents(
    params: PaginationParams & { status?: string },
    _language?: Language
  ): Promise<PaginatedResponse<typeof Event.prototype>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status } = params;

    const query: Record<string, unknown> = {};

    if (status) {
      const now = new Date();
      if (status === 'upcoming') {
        query.startDate = { $gt: now };
      } else if (status === 'active') {
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
      } else if (status === 'ended') {
        query.endDate = { $lt: now };
      }
    }

    const total = await Event.countDocuments(query);

    const events = await Event.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'firstName lastName email');

    const totalPages = Math.ceil(total / limit);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string, language?: Language) {
    const event = await Event.findById(eventId).populate('createdBy', 'firstName lastName email');

    if (!event) {
      throw new Error(t('event.not_found', {}, language));
    }

    return event;
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, data: UpdateEventDTO, userId: string, language?: Language) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error(t('event.not_found', {}, language));
    }

    if (event.createdBy.toString() !== userId) {
      throw new Error(t('auth.permission_denied', {}, language));
    }

    Object.assign(event, data);
    await event.save();

    return event;
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, userId: string, language?: Language): Promise<void> {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error(t('event.not_found', {}, language));
    }

    const vouchersCount = await Voucher.countDocuments({ eventId });
    if (vouchersCount > 0) {
      throw new Error(t('event.cannot_delete_with_vouchers', {}, language));
    }

    if (event.createdBy.toString() !== userId) {
      throw new Error(t('auth.permission_denied', {}, language));
    }

    await Event.deleteOne({ _id: eventId });
  }

  /**
   * Get user's created events
   */
  async getUserEvents(userId: string, params: PaginationParams) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const query = { createdBy: new Types.ObjectId(userId) };

    const total = await Event.countDocuments(query);

    const events = await Event.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Check if event is active
   */
  async isEventActive(eventId: string): Promise<boolean> {
    const event = await Event.findById(eventId);
    if (!event) return false;

    const now = new Date();
    return event.isActive && event.startDate <= now && event.endDate >= now;
  }

  /**
   * Check if vouchers available
   */
  async hasAvailableVouchers(eventId: string): Promise<boolean> {
    const event = await Event.findById(eventId);
    if (!event) return false;

    return event.issuedVouchers < event.maxVouchers;
  }
}

export default new EventService();
