/**
 * Quota Protection for Still's Hosted Mode
 *
 * Tracks global in-memory daily and per-minute model calls.
 * Reads limits from environment variables (default: 600 per day, 12 per minute).
 * Never logs user text or private keys.
 */

export const BUSY_USER_MESSAGE =
  "Still is resting for a moment. You can try again soon, or switch to Local mode in Settings.";

export function getDailyLimit(): number {
  const envVal =
    process.env.DAILY_QUOTA_LIMIT ||
    process.env.DAILY_MODEL_LIMIT ||
    process.env.MAX_DAILY_CALLS ||
    process.env.DAILY_LIMIT;
  const parsed = envVal ? parseInt(envVal, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 600;
}

export function getMinuteLimit(): number {
  const envVal =
    process.env.PER_MINUTE_QUOTA_LIMIT ||
    process.env.PER_MINUTE_MODEL_LIMIT ||
    process.env.MINUTE_LIMIT ||
    process.env.PER_MINUTE_LIMIT;
  const parsed = envVal ? parseInt(envVal, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
}

export interface QuotaStatus {
  dailyCount: number;
  dailyLimit: number;
  minuteCount: number;
  minuteLimit: number;
  isBusy: boolean;
  reason?: 'busy';
}

interface InMemoQuotaTracker {
  dailyCount: number;
  dailyResetAt: number;
  minuteCount: number;
  minuteResetAt: number;
  isExternal429: boolean;
  external429ResetAt: number;
}

const tracker: InMemoQuotaTracker = {
  dailyCount: 0,
  dailyResetAt: Date.now() + 24 * 60 * 60 * 1000,
  minuteCount: 0,
  minuteResetAt: Date.now() + 60 * 1000,
  isExternal429: false,
  external429ResetAt: 0,
};

/**
 * Resets window counters if elapsed.
 */
function refreshWindows(now: number = Date.now()): void {
  if (now >= tracker.minuteResetAt) {
    tracker.minuteCount = 0;
    tracker.minuteResetAt = now + 60 * 1000;
  }
  if (now >= tracker.dailyResetAt) {
    tracker.dailyCount = 0;
    tracker.dailyResetAt = now + 24 * 60 * 60 * 1000;
  }
  if (tracker.isExternal429 && now >= tracker.external429ResetAt) {
    tracker.isExternal429 = false;
    tracker.external429ResetAt = 0;
  }
}

/**
 * Checks whether quota permits a model call without incrementing.
 */
export function checkModelQuota(now: number = Date.now()): { allowed: boolean; reason?: 'busy' } {
  refreshWindows(now);
  const dailyLimit = getDailyLimit();
  const minuteLimit = getMinuteLimit();

  if (tracker.isExternal429 || tracker.minuteCount >= minuteLimit || tracker.dailyCount >= dailyLimit) {
    return { allowed: false, reason: 'busy' };
  }
  return { allowed: true };
}

/**
 * Records an actual call to the model.
 */
export function recordModelCall(now: number = Date.now()): void {
  refreshWindows(now);
  tracker.dailyCount += 1;
  tracker.minuteCount += 1;
}

/**
 * Marks upstream 429 / RESOURCE_EXHAUSTED from Gemini API.
 * Puts Still in busy state for a short cooldown (default 60s).
 */
export function markExternal429(cooldownMs: number = 60 * 1000, now: number = Date.now()): void {
  tracker.isExternal429 = true;
  tracker.external429ResetAt = now + cooldownMs;
}

/**
 * Returns current snapshot of quota counters for debug / inspection.
 */
export function getQuotaStatus(now: number = Date.now()): QuotaStatus {
  refreshWindows(now);
  const dailyLimit = getDailyLimit();
  const minuteLimit = getMinuteLimit();
  const isBusy =
    tracker.isExternal429 ||
    tracker.minuteCount >= minuteLimit ||
    tracker.dailyCount >= dailyLimit;

  return {
    dailyCount: tracker.dailyCount,
    dailyLimit,
    minuteCount: tracker.minuteCount,
    minuteLimit,
    isBusy,
    reason: isBusy ? 'busy' : undefined,
  };
}

/**
 * For testing purposes: resets the in-memory tracker.
 */
export function resetQuotaTrackerForTest(now: number = Date.now()): void {
  tracker.dailyCount = 0;
  tracker.dailyResetAt = now + 24 * 60 * 60 * 1000;
  tracker.minuteCount = 0;
  tracker.minuteResetAt = now + 60 * 1000;
  tracker.isExternal429 = false;
  tracker.external429ResetAt = 0;
}

/**
 * Classifies errors into standard reason codes:
 * - "busy" on 429, RESOURCE_EXHAUSTED, quota exceeded
 * - "no API key"
 * - "model not found"
 * - "timeout"
 * - "unknown error"
 */
export function classifyError(err: unknown): string {
  if (!err) return 'unknown error';
  const msg = String((err as any)?.message || err || '').toLowerCase();
  const status = (err as any)?.status || (err as any)?.code;

  if (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return 'busy';
  }

  if (
    msg.includes('no api key') ||
    msg.includes('api key not valid') ||
    msg.includes('api_key_invalid') ||
    msg.includes('unauthenticated') ||
    msg.includes('api key missing') ||
    msg.includes('api_key_missing') ||
    msg.includes('pass a valid api key') ||
    status === 401 ||
    status === 403
  ) {
    return 'no API key';
  }

  if (
    msg.includes('not found') ||
    msg.includes('not_found') ||
    msg.includes('is not supported for generatecontent') ||
    status === 404
  ) {
    return 'model not found';
  }

  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('deadline exceeded')
  ) {
    return 'timeout';
  }

  return 'unknown error';
}
