import { Types, ClientSession } from 'mongoose';
import { Event, Voucher } from '../models';
import { generateVoucherCode, generateVoucherExpiry } from '../utils/voucher.util';
import {
  VoucherResponse,
  PaginatedResponse,
  PaginationParams,
  Language,
  VoucherStatus,
  IEvent,
} from '../types';
import { t } from '../config/i18n';
import { retryTransaction } from '../utils/transaction.util';

export class VoucherService {
  private async validateAndCheckEligibility(
    eventId: string,
    userId: string,
    session: ClientSession,
    language?: Language
  ): Promise<IEvent> {
    const existingVoucher = await Voucher.findOne({
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(userId),
    }).session(session);

    if (existingVoucher) {
      throw new Error(t('voucher.already_claimed', {}, language));
    }

    const event = await Event.findById(eventId).session(session);
    if (!event) {
      throw new Error(t('event.not_found', {}, language));
    }

    if (!event.isActive) {
      throw new Error(t('voucher.event_inactive', {}, language));
    }

    const now = new Date();
    if (now < event.startDate) {
      throw new Error(t('voucher.event_not_started', {}, language));
    }
    if (now > event.endDate) {
      throw new Error(t('voucher.event_ended', {}, language));
    }
    if (event.issuedVouchers >= event.maxVouchers) {
      throw new Error(t('voucher.not_available', {}, language));
    }

    return event;
  }

  private async generateUniqueCode(session: ClientSession): Promise<string> {
    const MAX_ATTEMPTS = 5;

    for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
      const code = generateVoucherCode();
      const existing = await Voucher.findOne({ code }).session(session);
      if (!existing) return code;
    }

    throw new Error('Failed to generate unique voucher code');
  }

  async issueVoucher(
    eventId: string,
    userId: string,
    language?: Language
  ): Promise<VoucherResponse> {
    return await retryTransaction(async (session: ClientSession) => {
      const event = await this.validateAndCheckEligibility(eventId, userId, session, language);

      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          issuedVouchers: { $lt: event.maxVouchers },
        },
        {
          $inc: { issuedVouchers: 1 },
        },
        {
          session,
          new: true,
        }
      );

      if (!updatedEvent) {
        throw new Error(t('voucher.not_available', {}, language));
      }

      const voucherCode = await this.generateUniqueCode(session);

      const [voucher] = await Voucher.create(
        [
          {
            code: voucherCode,
            eventId: new Types.ObjectId(eventId),
            userId: new Types.ObjectId(userId),
            issuedAt: new Date(),
            expiresAt: generateVoucherExpiry(30),
          },
        ],
        { session }
      );

      return {
        id: voucher._id.toString(),
        code: voucher.code,
        eventId,
        eventTitle: updatedEvent.title,
        issuedAt: voucher.issuedAt,
        expiresAt: voucher.expiresAt,
        isUsed: voucher.isUsed,
        status: VoucherStatus.AVAILABLE,
      };
    });
  }

  async useVoucher(code: string, userId: string, language?: Language): Promise<void> {
    const voucher = await Voucher.findOne({ code: code.toUpperCase() }).populate('eventId');

    if (!voucher) {
      throw new Error(t('voucher.invalid_code', {}, language));
    }

    if (voucher.userId.toString() !== userId) {
      throw new Error(t('voucher.not_yours', {}, language));
    }

    if (voucher.isUsed) {
      throw new Error(t('voucher.already_used', {}, language));
    }

    if (new Date() > voucher.expiresAt) {
      throw new Error(t('voucher.expired', {}, language));
    }

    voucher.isUsed = true;
    voucher.usedAt = new Date();
    await voucher.save();
  }

  async getUserVouchers(
    userId: string,
    params: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<VoucherResponse>> {
    const { page = 1, limit = 10, sortBy = 'issuedAt', sortOrder = 'desc', status } = params;

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (status === 'available') {
      query.isUsed = false;
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'used') {
      query.isUsed = true;
    } else if (status === 'expired') {
      query.isUsed = false;
      query.expiresAt = { $lte: new Date() };
    }

    const total = await Voucher.countDocuments(query);

    const vouchers = await Voucher.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('eventId', 'title description startDate endDate');

    const data: VoucherResponse[] = vouchers.map((v) => {
      const event = v.eventId as any;
      return {
        id: v._id.toString(),
        code: v.code,
        eventId: event._id.toString(),
        eventTitle: event.title,
        issuedAt: v.issuedAt,
        expiresAt: v.expiresAt,
        isUsed: v.isUsed,
        status: v.isUsed
          ? VoucherStatus.USED
          : new Date() > v.expiresAt
            ? VoucherStatus.EXPIRED
            : VoucherStatus.AVAILABLE,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

  async getVoucherByCode(
    code: string,
    userId: string,
    language?: Language
  ): Promise<VoucherResponse> {
    const voucher = await Voucher.findOne({ code: code.toUpperCase() }).populate(
      'eventId',
      'title description'
    );

    if (!voucher) {
      throw new Error(t('voucher.invalid_code', {}, language));
    }

    if (voucher.userId.toString() !== userId) {
      throw new Error(t('voucher.not_yours', {}, language));
    }

    const event = voucher.eventId as any;

    return {
      id: voucher._id.toString(),
      code: voucher.code,
      eventId: event._id.toString(),
      eventTitle: event.title,
      issuedAt: voucher.issuedAt,
      expiresAt: voucher.expiresAt,
      isUsed: voucher.isUsed,
      status: voucher.isUsed
        ? VoucherStatus.USED
        : new Date() > voucher.expiresAt
          ? VoucherStatus.EXPIRED
          : VoucherStatus.AVAILABLE,
    };
  }

  async getEventVouchersStats(eventId: string) {
    const total = await Voucher.countDocuments({ eventId });
    const used = await Voucher.countDocuments({ eventId, isUsed: true });
    const expired = await Voucher.countDocuments({
      eventId,
      isUsed: false,
      expiresAt: { $lte: new Date() },
    });
    const available = total - used - expired;

    return {
      total,
      used,
      expired,
      available,
    };
  }
}

export default new VoucherService();
