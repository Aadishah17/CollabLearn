const mongoose = require('mongoose');

const DEFAULT_LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/collablearn';
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_RETRY_DELAY_MS = 30000;

const connectionState = {
  status: 'idle',
  attempts: 0,
  lastAttemptAt: null,
  lastConnectedAt: null,
  lastError: null,
  nextRetryAt: null,
};

let activeConnectionPromise = null;
let connectionListenersBound = false;
let lastConnectOptions = {};

const resolveFiniteNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveMaxAttempts = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Infinity;
  }

  return Math.floor(parsed);
};

const resolveMongoUri = () => {
  const primary = String(process.env.MONGODB_URI || '').trim();
  const legacy = String(process.env.MONGO_URI || '').trim();
  return primary || legacy || DEFAULT_LOCAL_MONGO_URI;
};

const redactMongoUri = (mongoUri) => {
  const normalized = String(mongoUri || '').trim();
  if (!normalized) {
    return normalized;
  }

  return normalized.replace(/\/\/([^:/@]+)(?::([^@]*))?@/, (_match, username, password) => {
    if (password === undefined) {
      return `//${username}@`;
    }

    return `//${username}:***@`;
  });
};

const buildMongoConnectOptions = (mongoUri) => {
  const options = {
    serverSelectionTimeoutMS: 10000,
  };

  if (/^mongodb:\/\/(localhost|127\.0\.0\.1)(?::|\/)/i.test(String(mongoUri || '').trim())) {
    options.family = 4;
  }

  return options;
};

const sleep = (ms) =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

const snapshotConnectionState = () => ({
  ...connectionState,
  readyState: mongoose.connection.readyState,
  mongoUri: redactMongoUri(resolveMongoUri()),
});

const ensureConnectionListeners = () => {
  if (connectionListenersBound) {
    return;
  }

  mongoose.connection.on('connected', () => {
    connectionState.status = 'connected';
    connectionState.lastConnectedAt = new Date().toISOString();
    connectionState.lastError = null;
    connectionState.nextRetryAt = null;
  });

  mongoose.connection.on('reconnected', () => {
    connectionState.status = 'connected';
    connectionState.lastConnectedAt = new Date().toISOString();
    connectionState.lastError = null;
    connectionState.nextRetryAt = null;
  });

  mongoose.connection.on('disconnected', () => {
    connectionState.status = 'degraded';
    if (!activeConnectionPromise) {
      void connectDB(lastConnectOptions);
    }
  });

  mongoose.connection.on('error', (error) => {
    connectionState.lastError = error?.message || 'Unknown MongoDB error';
  });

  connectionListenersBound = true;
};

const connectDB = async (options = {}) => {
  ensureConnectionListeners();

  if (mongoose.connection.readyState === 1) {
    connectionState.status = 'connected';
    connectionState.lastConnectedAt = connectionState.lastConnectedAt || new Date().toISOString();
    connectionState.lastError = null;
    connectionState.nextRetryAt = null;
    return mongoose.connection;
  }

  if (activeConnectionPromise) {
    return activeConnectionPromise;
  }

  const normalizedOptions = {
    maxAttempts:
      Number.isInteger(options.maxAttempts) && options.maxAttempts > 0
        ? options.maxAttempts
        : resolveMaxAttempts(process.env.DB_CONNECT_MAX_ATTEMPTS),
    retryDelayMs:
      Number.isFinite(Number(options.retryDelayMs)) && Number(options.retryDelayMs) > 0
        ? Number(options.retryDelayMs)
        : resolveFiniteNumber(process.env.DB_CONNECT_RETRY_BASE_MS, DEFAULT_RETRY_DELAY_MS),
    maxRetryDelayMs:
      Number.isFinite(Number(options.maxRetryDelayMs)) && Number(options.maxRetryDelayMs) > 0
        ? Number(options.maxRetryDelayMs)
        : resolveFiniteNumber(process.env.DB_CONNECT_RETRY_MAX_MS, DEFAULT_MAX_RETRY_DELAY_MS),
    logger: options.logger || console,
  };

  lastConnectOptions = { ...normalizedOptions };
  const mongoUri = resolveMongoUri();
  const mongoOptions = buildMongoConnectOptions(mongoUri);

  activeConnectionPromise = (async () => {
    let attempt = 0;

    while (normalizedOptions.maxAttempts === Infinity || attempt < normalizedOptions.maxAttempts) {
      attempt += 1;
      connectionState.attempts = attempt;
      connectionState.status = attempt === 1 ? 'connecting' : 'reconnecting';
      connectionState.lastAttemptAt = new Date().toISOString();
      connectionState.nextRetryAt = null;

      try {
        await mongoose.connect(mongoUri, mongoOptions);
        connectionState.status = 'connected';
        connectionState.lastConnectedAt = new Date().toISOString();
        connectionState.lastError = null;
        connectionState.nextRetryAt = null;
        normalizedOptions.logger.info?.('MongoDB connected successfully');
        return mongoose.connection;
      } catch (error) {
        connectionState.status = 'degraded';
        connectionState.lastError = error?.message || 'MongoDB connection failed';

        const resolvedAttempts =
          normalizedOptions.maxAttempts === Infinity ? 'unbounded' : normalizedOptions.maxAttempts;
        normalizedOptions.logger.error?.(
          `MongoDB connection attempt ${attempt}/${resolvedAttempts} failed: ${connectionState.lastError}`
        );

        if (
          normalizedOptions.maxAttempts !== Infinity &&
          attempt >= normalizedOptions.maxAttempts
        ) {
          return null;
        }

        const retryDelay = Math.min(
          normalizedOptions.maxRetryDelayMs,
          normalizedOptions.retryDelayMs * Math.pow(2, Math.max(0, attempt - 1))
        );

        connectionState.nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
        normalizedOptions.logger.info?.(
          `Retrying MongoDB connection in ${Math.round(retryDelay / 1000)}s`
        );
        await sleep(retryDelay);
      }
    }

    return null;
  })()
    .catch((error) => {
      connectionState.status = 'degraded';
      connectionState.lastError = error?.message || 'MongoDB connection loop failed';
      normalizedOptions.logger.error?.(
        `MongoDB connection loop failed: ${connectionState.lastError}`
      );
      return null;
    })
    .finally(() => {
      activeConnectionPromise = null;
    });

  return activeConnectionPromise;
};

module.exports = {
  buildMongoConnectOptions,
  connectDB,
  resolveMongoUri,
  redactMongoUri,
  DEFAULT_LOCAL_MONGO_URI,
  getMongoConnectionState: snapshotConnectionState,
};
