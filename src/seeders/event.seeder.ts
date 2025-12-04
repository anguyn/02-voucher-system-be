import { faker } from '@faker-js/faker';
import { Event } from '../models';
import { Types } from 'mongoose';

export class EventSeeder {
  private generateEventDates(startDaysFromNow: number, durationDays: number) {
    const startDate = faker.date.soon({ days: startDaysFromNow });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    return { startDate, endDate };
  }

  async seed(adminId: Types.ObjectId, managerId: Types.ObjectId) {
    console.log('📅 Creating events...');

    const blackFridayDates = this.generateEventDates(1, 3);
    const flashSaleDates = this.generateEventDates(7, 1);
    const summerFestivalDates = this.generateEventDates(30, 30);
    const weekendDates = this.generateEventDates(2, 2);

    const eventData = [
      {
        title: 'Black Friday Mega Sale',
        description: faker.commerce.productDescription(),
        startDate: blackFridayDates.startDate,
        endDate: blackFridayDates.endDate,
        maxVouchers: 100,
        issuedVouchers: faker.number.int({ min: 30, max: 60 }),
        isActive: true,
        createdBy: adminId,
      },
      {
        title: 'New Year Celebration 2025',
        description: faker.commerce.productDescription(),
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-05'),
        maxVouchers: 200,
        issuedVouchers: 0,
        isActive: true,
        createdBy: managerId,
      },
      {
        title: 'Flash Sale - Electronics',
        description: 'Limited time offers on electronics and gadgets!',
        startDate: flashSaleDates.startDate,
        endDate: flashSaleDates.endDate,
        maxVouchers: 50,
        issuedVouchers: 50,
        isActive: true,
        createdBy: adminId,
      },
      {
        title: 'Summer Festival Extravaganza',
        description: faker.lorem.paragraph(),
        startDate: summerFestivalDates.startDate,
        endDate: summerFestivalDates.endDate,
        maxVouchers: 500,
        issuedVouchers: faker.number.int({ min: 100, max: 200 }),
        isActive: true,
        createdBy: managerId,
      },
      {
        title: 'Weekend Special Offers',
        description: faker.commerce.productDescription(),
        startDate: weekendDates.startDate,
        endDate: weekendDates.endDate,
        maxVouchers: 150,
        issuedVouchers: faker.number.int({ min: 50, max: 100 }),
        isActive: true,
        createdBy: adminId,
      },
    ];

    const events = await Event.create(eventData);

    console.log(`✅ Created ${events.length} events`);

    return events;
  }

  async clear() {
    await Event.deleteMany({});
  }
}
