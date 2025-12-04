import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env.local';

const result = dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

if (result.error) {
  console.error(`❌ Failed to load ${envFile}:`, result.error.message);
  process.exit(1);
}

console.log(`📄 Loaded environment from: ${envFile}\n`);

import { redisClient } from '../config/redis';

async function clearRateLimits(pattern: string = 'rl:*') {
  try {
    console.log('✅ Using existing Redis client\n');

    console.log(`🔍 Searching for keys matching: ${pattern}`);
    const keys = await redisClient.keys(pattern);
    console.log(`📊 Found ${keys.length} rate limit keys`);

    if (keys.length > 0) {
      console.log('\nKeys to be deleted:');
      keys.forEach((key) => console.log(`  - ${key}`));

      console.log('\n🗑️  Deleting...');
      await redisClient.del(...keys);
      console.log('✅ All rate limits cleared successfully\n');
    } else {
      console.log('ℹ️  No rate limit keys found\n');
    }

    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await redisClient.quit();
    process.exit(1);
  }
}

const pattern = process.argv[2] || 'rl:*';
console.log('🚀 Starting rate limit cleaner...\n');
clearRateLimits(pattern);
