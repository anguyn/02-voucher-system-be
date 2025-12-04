import dotenv from 'dotenv';
import path from 'path';

export function loadEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'local';

  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  const envFile = `.env.${nodeEnv}`;
  const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  if (result.error) {
    console.warn(`⚠️  ${envFile} not found, using .env only`);
  } else {
    console.log(`✅ Loaded: .env + ${envFile}`);
  }
}
