/**
 * In-memory sliding-window rate limiter for AI routes.
 * Tracks request counts per authenticated user within a configurable time window.
 * Returns 429 Too Many Requests when the limit is exceeded.
 */

// Store: Map<userId, { count, windowStart }>
const userRequestMap = new Map();

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userRequestMap) {
    if (now - entry.windowStart > entry.windowMs * 2) {
      userRequestMap.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Creates a rate-limiting middleware for AI routes.
 *
 * @param {Object} options
 * @param {number} [options.maxRequests=20] - Maximum requests allowed per window.
 * @param {number} [options.windowMs=900000] - Window size in milliseconds (default 15 min).
 * @returns Express middleware function.
 */
function aiRateLimit({ maxRequests = 20, windowMs = 15 * 60 * 1000 } = {}) {
  return (req, res, next) => {
    // Require authentication — user must be set by protect middleware
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required for AI features' });
    }

    const now = Date.now();
    const entry = userRequestMap.get(userId);

    if (!entry || now - entry.windowStart > windowMs) {
      // Start a new window
      userRequestMap.set(userId, { count: 1, windowStart: now, windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterMs = windowMs - (now - entry.windowStart);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        message: `AI rate limit exceeded. Please try again in ${retryAfterSec} seconds.`,
        retryAfter: retryAfterSec
      });
    }

    entry.count += 1;
    return next();
  };
}

module.exports = { aiRateLimit };
