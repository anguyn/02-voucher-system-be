import mongoose from 'mongoose';
import { RefreshToken, User, Voucher, Event, EditLock } from '../models';
import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env.local';

const result = dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

if (result.error) {
  console.error(`❌ Failed to load ${envFile}:`, result.error.message);
  process.exit(1);
}

async function clearIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    console.log('Dropping duplicate indexes...');

    await User.collection.dropIndexes();
    await Voucher.collection.dropIndexes();
    await RefreshToken.collection.dropIndexes();
    await Event.collection.dropIndexes();
    await EditLock.collection.dropIndexes();

    console.log('Indexes dropped!');

    await User.syncIndexes();
    await Voucher.syncIndexes();
    await RefreshToken.syncIndexes();
    await Event.syncIndexes();
    await EditLock.syncIndexes();

    console.log('Indexes recreated successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

clearIndexes();
