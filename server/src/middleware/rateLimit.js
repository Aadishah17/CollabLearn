const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests. Please try again later.',
  keyGenerator,
  nowProvider = () => Date.now()
} = {}) => {
  const buckets = new Map();

  const resolveKey = (req) => {
    if (typeof keyGenerator === 'function') {
      const generated = keyGenerator(req);
      if (generated) {
        return String(generated);
      }
    }

    return `${req.ip || req.headers['x-forwarded-for'] || 'unknown'}:${req.baseUrl || req.path || 'global'}`;
  };

  const pruneExpiredBuckets = (now) => {
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.startedAt >= windowMs) {
        buckets.delete(key);
      }
    }
  };

  return (req, res, next) => {
    const now = nowProvider();
    pruneExpiredBuckets(now);

    const key = resolveKey(req);
    const existing = buckets.get(key);

    if (!existing || now - existing.startedAt >= windowMs) {
      buckets.set(key, { count: 1, startedAt: now });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      return res.status(429).json({
        success: false,
        message
      });
    }

    return next();
  };
};

module.exports = {
  createRateLimiter
};
