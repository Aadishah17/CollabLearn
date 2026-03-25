let redisModule = null;

try {
  redisModule = require('redis');
} catch (_error) {
  redisModule = null;
}

const sharedRedisClients = new Map();

const createMemoryStore = (windowMs) => {
  const buckets = new Map();

  return {
    increment(key, now) {
      const startedAt = Math.floor(now / windowMs) * windowMs;
      const existing = buckets.get(key);

      if (!existing || existing.startedAt !== startedAt) {
        buckets.set(key, { count: 1, startedAt });
        return { count: 1, resetAt: startedAt + windowMs, source: 'memory' };
      }

      existing.count += 1;
      return {
        count: existing.count,
        resetAt: existing.startedAt + windowMs,
        source: 'memory'
      };
    },

    clear() {
      buckets.clear();
    }
  };
};

const getLogger = (logger = console) => ({
  warn: typeof logger?.warn === 'function' ? logger.warn.bind(logger) : console.warn.bind(console),
  error: typeof logger?.error === 'function' ? logger.error.bind(logger) : console.error.bind(console),
  info: typeof logger?.info === 'function' ? logger.info.bind(logger) : console.log.bind(console)
});

const getRedisState = (redisUrl, logger = console) => {
  if (!redisModule || !redisUrl) {
    return null;
  }

  if (sharedRedisClients.has(redisUrl)) {
    return sharedRedisClients.get(redisUrl);
  }

  const normalizedLogger = getLogger(logger);
  const client = redisModule.createClient({
    url: redisUrl,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: () => false
    }
  });
  const state = {
    client,
    connectPromise: null,
    hasWarned: false,
    lastError: null
  };

  client.on('error', (error) => {
    state.lastError = error;
    if (!state.hasWarned) {
      normalizedLogger.warn(
        `[rate-limit] Redis client error for ${redisUrl}; falling back to local counters: ${error.message}`
      );
      state.hasWarned = true;
    }
  });

  state.connectPromise = client
    .connect()
    .catch((error) => {
      state.lastError = error;
      if (!state.hasWarned) {
        normalizedLogger.warn(
          `[rate-limit] Redis connection unavailable for ${redisUrl}; using local counters: ${error.message}`
        );
        state.hasWarned = true;
      }
      return null;
    });

  sharedRedisClients.set(redisUrl, state);
  return state;
};

const createRedisStore = ({ redisUrl, keyPrefix, windowMs, logger = console }) => {
  const memoryStore = createMemoryStore(windowMs);
  const redisState = getRedisState(redisUrl, logger);

  if (!redisState) {
    return {
      increment: memoryStore.increment.bind(memoryStore),
      fallbackIncrement: memoryStore.increment.bind(memoryStore)
    };
  }

  const ensureRedisReady = () => redisState.client?.isReady === true;

  return {
    async increment(key, now) {
      if (!ensureRedisReady()) {
        return memoryStore.increment(key, now);
      }

      const windowStart = Math.floor(now / windowMs) * windowMs;
      const redisKey = `${keyPrefix}:${windowStart}:${key}`;

      try {
        const count = await redisState.client.incr(redisKey);

        if (count === 1) {
          await redisState.client.expire(redisKey, Math.max(1, Math.ceil(windowMs / 1000)));
        }

        const ttlSeconds = await redisState.client.ttl(redisKey);
        const resetAt =
          typeof ttlSeconds === 'number' && ttlSeconds > 0
            ? now + ttlSeconds * 1000
            : windowStart + windowMs;

        return {
          count,
          resetAt,
          source: 'redis'
        };
      } catch (error) {
        redisState.lastError = error;
        if (!redisState.hasWarned) {
          getLogger(logger).warn(
            `[rate-limit] Redis increment failed for ${redisUrl}; using local counters: ${error.message}`
          );
          redisState.hasWarned = true;
        }

        return memoryStore.increment(key, now);
      }
    },
    fallbackIncrement: memoryStore.increment.bind(memoryStore)
  };
};

const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests. Please try again later.',
  keyGenerator,
  nowProvider = () => Date.now(),
  redisUrl = process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL,
  keyPrefix = 'collablearn:rate-limit',
  logger = console
} = {}) => {
  const store = createRedisStore({
    redisUrl,
    keyPrefix,
    windowMs,
    logger
  });

  const resolveKey = (req) => {
    if (typeof keyGenerator === 'function') {
      const generated = keyGenerator(req);
      if (generated) {
        return String(generated);
      }
    }

    const forwardedFor = String(req.headers?.['x-forwarded-for'] || '').trim();
    const sourceIp = forwardedFor || req.ip || 'unknown';
    return `${sourceIp}:${req.baseUrl || req.path || 'global'}`;
  };

  const finalize = (res, next, result, now) => {
    if (result.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAt - now) / 1000)
      );

      if (typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', String(retryAfterSeconds));
      }

      return res.status(429).json({
        success: false,
        message
      });
    }

    return next();
  };

  return (req, res, next) => {
    const now = nowProvider();
    const key = resolveKey(req);

    try {
      const result = store.increment(key, now);

      if (result && typeof result.then === 'function') {
        return result
          .then((value) => finalize(res, next, value, now))
          .catch((error) => {
            getLogger(logger).warn(
              `[rate-limit] Redis store failed unexpectedly; falling back to in-memory counters: ${error.message}`
            );
            return finalize(res, next, store.fallbackIncrement(key, now), now);
          });
      }

      return finalize(res, next, result, now);
    } catch (error) {
      getLogger(logger).warn(
        `[rate-limit] Local counter failed; allowing request to continue: ${error.message}`
      );
      return finalize(res, next, store.fallbackIncrement(key, now), now);
    }
  };
};

module.exports = {
  createRateLimiter,
  createMemoryStore,
  createRedisStore
};
