import { faker } from '@faker-js/faker';
import { Voucher } from '../models';
import { generateVoucherCode, generateVoucherExpiry } from '../utils/voucher.util';
import { IUser, IEvent } from '../types';

export class VoucherSeeder {
  async seed(users: IUser[], events: IEvent[]) {
    console.log('🎟️  Creating vouchers...');

    const voucherData = [];

    for (let i = 0; i < 20; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const randomEvent = faker.helpers.arrayElement(events.slice(0, 3));

      voucherData.push({
        code: generateVoucherCode(),
        eventId: randomEvent._id,
        userId: randomUser._id,
        issuedAt: faker.date.recent({ days: 10 }),
        expiresAt: generateVoucherExpiry(30),
        isUsed: faker.datatype.boolean({ probability: 0.3 }),
        usedAt: faker.datatype.boolean({ probability: 0.3 })
          ? faker.date.recent({ days: 5 })
          : undefined,
      });
    }

    const vouchers = await Voucher.create(voucherData);

    console.log(`✅ Created ${vouchers.length} vouchers`);

    return vouchers;
  }

  async clear() {
    await Voucher.deleteMany({});
  }
}
