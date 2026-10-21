/**
 * Resilient Retry Helper with Exponential Backoff and Jitter
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOn?: (error: any) => boolean;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    maxDelayMs = 4000,
    backoffFactor = 2,
    retryOn = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (error: any) {
      lastError = error;

      if (attempt >= maxRetries || !retryOn(error)) {
        throw error;
      }

      // Exponential backoff with random jitter: delay * factor^(attempt-1) + jitter
      const rawDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const jitter = Math.random() * (initialDelayMs * 0.5);
      const delay = Math.min(rawDelay + jitter, maxDelayMs);

      console.warn(
        `[Agent Retry] Attempt ${attempt} failed: ${error?.message || error}. Retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Resilient Fallback Wrapper
 * Tries the primary operation with retries; if all attempts fail, invokes the fallback function
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: (error: any) => Promise<T> | T,
  options?: RetryOptions
): Promise<T> {
  try {
    return await withRetry(primary, options);
  } catch (error: any) {
    console.warn(`[Agent Fallback] Primary operation failed after retries. Engaging fallback... Reason:`, error?.message || error);
    return await fallback(error);
  }
}
