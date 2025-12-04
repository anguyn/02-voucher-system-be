import { faker } from '@faker-js/faker';
import { User } from '../models';
import { UserRole, Language } from '../types';

export class UserSeeder {
  async seed() {
    console.log('👤 Creating users...');

    await User.create({
      email: 'anguynvn99@gmail.com',
      password: 'password@123',
      firstName: 'An',
      lastName: 'Nguyen 1',
      role: UserRole.USER,
      language: Language.VI,
      isActive: true,
    });

    await User.create({
      email: 'an.nguyen@hdwebsoft.dev',
      password: 'password@123',
      firstName: 'An',
      lastName: 'Nguyen 2',
      role: UserRole.USER,
      language: Language.VI,
      isActive: true,
    });

    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password@123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      language: Language.EN,
      isActive: true,
    });

    const manager = await User.create({
      email: 'manager@test.com',
      password: 'password@123',
      firstName: 'Manager',
      lastName: 'User',
      role: UserRole.MANAGER,
      language: Language.EN,
      isActive: true,
    });

    const users = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        User.create({
          email: `user${i + 1}@test.com`,
          password: 'password@123',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: UserRole.USER,
          language: faker.helpers.arrayElement([Language.EN, Language.VI]),
          isActive: true,
        })
      )
    );

    const userCount = await User.countDocuments();

    console.log(`✅ Created ${userCount} users`);

    return { admin, manager, users };
  }

  async clear() {
    await User.deleteMany({});
  }
}
