import mongoose, { ClientSession } from 'mongoose';

/**
 * Retry transaction on transient errors
 * As per MongoDB best practice: https://docs.mongodb.com/v4.0/core/transactions/#retry-commit-operation
 */
export const retryTransaction = async <T>(
  operation: (session: ClientSession) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await operation(session);

      await commitWithRetry(session);

      return result;
    } catch (error) {
      await session.abortTransaction();
      lastError = error as Error;

      const isTransientError = isTransientTransactionError(error as Error);

      if (!isTransientError || attempt === maxRetries) {
        throw error;
      }

      console.warn(`⚠️  Transaction attempt ${attempt} failed, retrying...`);

      await sleep(Math.pow(2, attempt) * 100);
    } finally {
      session.endSession();
    }
  }

  throw lastError || new Error('Transaction failed after retries');
};

/**
 * Commit transaction with retry on transient errors
 */
const commitWithRetry = async (session: ClientSession, maxRetries: number = 3): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await session.commitTransaction();
      return;
    } catch (error) {
      const isTransientError = isTransientTransactionError(error as Error);

      if (!isTransientError || attempt === maxRetries) {
        throw error;
      }

      console.warn(`⚠️  Commit attempt ${attempt} failed, retrying...`);
      await sleep(Math.pow(2, attempt) * 100);
    }
  }
};

/**
 * Check if error is a transient transaction error
 */
const isTransientTransactionError = (error: Error): boolean => {
  return (
    error.message.includes('TransientTransactionError') ||
    error.message.includes('WriteConflict') ||
    error.message.includes('NoSuchTransaction')
  );
};

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default {
  retryTransaction,
};
