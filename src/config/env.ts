import dotenv from 'dotenv';
import path from 'path';

export const loadEnv = () => {
  const env = process.env.NODE_ENV || 'development';

  dotenv.config();

  let envFile = '.env.local';
  if (env === 'test') {
    envFile = '.env.test';
  } else if (env === 'production') {
    envFile = '.env.production';
  }

  const result = dotenv.config({
    path: path.resolve(process.cwd(), envFile),
    override: true,
  });

  if (result.error) {
    if (env === 'test') {
      console.warn(`⚠️  ${envFile} not found, using default test values`);
    } else {
      console.warn(`⚠️  ${envFile} not found, using .env only`);
    }
  } else {
    console.log(`✅ Loaded: .env + ${envFile}`);
  }
};
