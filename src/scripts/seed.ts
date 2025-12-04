import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { UserSeeder, EventSeeder, VoucherSeeder } from '../seeders';

const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env.local';

const result = dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

if (result.error) {
  console.error(`❌ Failed to load ${envFile}:`, result.error.message);
  process.exit(1);
}

console.log(`📄 Loaded environment from: ${envFile}\n`);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher-system';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userSeeder = new UserSeeder();
    const eventSeeder = new EventSeeder();
    const voucherSeeder = new VoucherSeeder();

    console.log('🗑️  Clearing existing data...');
    await Promise.all([userSeeder.clear(), eventSeeder.clear(), voucherSeeder.clear()]);
    console.log('✅ Cleared existing data');

    const { admin, manager, users } = await userSeeder.seed();
    const events = await eventSeeder.seed(admin._id, manager._id);
    const vouchers = await voucherSeeder.seed(users, events);

    console.log('\n' + '='.repeat(70));
    console.log('✅ Database seeded successfully with realistic data!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length + 4} (1 Admin, 1 Manager, ${users.length + 2} Users)`);
    console.log(`   Events: ${events.length}`);
    console.log(`   Vouchers: ${vouchers.length}`);
    console.log('\n🔑 Test Accounts:');
    console.log('   ┌─ Admin:');
    console.log('   │  Email: admin@test.com');
    console.log('   │  Password: password@123');
    console.log('   ├─ Manager:');
    console.log('   │  Email: manager@test.com');
    console.log('   │  Password: password@123');
    console.log('   └─ Users:');
    console.log('      Email: user1@test.com to user10@test.com');
    console.log('      Password: password@123');
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

void seedDatabase();
