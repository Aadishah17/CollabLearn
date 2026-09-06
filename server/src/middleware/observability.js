const crypto = require('crypto');
const mongoose = require('mongoose');

const isProduction = String(process.env.NODE_ENV || '').trim() === 'production';

/**
 * Structured logger utility
 */
const structuredLog = (level, event, payload = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  if (isProduction) {
    console.log(JSON.stringify(logEntry));
  } else {
    const statusPart = payload.statusCode ? ` [${payload.statusCode}]` : '';
    const latencyPart = payload.latencyMs !== undefined ? ` (${payload.latencyMs}ms)` : '';
    const reqPart = payload.requestId ? ` [req:${payload.requestId.slice(0, 8)}]` : '';
    console.log(
      `[${level.toUpperCase()}] ${event}${reqPart}${statusPart}${latencyPart}`,
      payload.error || ''
    );
  }
};

/**
 * Express Request Observability Middleware
 */
const requestObservability = (req, res, next) => {
  const incomingRequestId = req.header('X-Request-Id') || req.header('x-request-id');
  const requestId = incomingRequestId || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;
    const userId = req.userId || req.auth?.userId || null;
    const route = req.baseUrl ? `${req.baseUrl}${req.path}` : req.originalUrl || req.url;

    // Log requests (warn/error on 4xx/5xx, info on 2xx/3xx)
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    structuredLog(level, 'http_request', {
      requestId,
      userId,
      method: req.method,
      route,
      statusCode: res.statusCode,
      latencyMs,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.header('user-agent'),
    });
  });

  next();
};

/**
 * AI Provider Telemetry Logger
 */
const logAiTelemetry = ({
  requestId = null,
  provider,
  model,
  latencyMs,
  status = 'success',
  error = null,
}) => {
  structuredLog(status === 'success' ? 'info' : 'error', 'ai_telemetry', {
    requestId,
    provider,
    model,
    latencyMs,
    status,
    error: error?.message || error,
  });
};

/**
 * Upload Telemetry Logger
 */
const logUploadTelemetry = ({
  requestId = null,
  userId = null,
  filename,
  size,
  provider,
  success,
  error = null,
}) => {
  structuredLog(success ? 'info' : 'error', 'upload_telemetry', {
    requestId,
    userId,
    filename,
    size,
    provider,
    success,
    error: error?.message || error,
  });
};

/**
 * Socket.IO Telemetry Logger
 */
const logSocketTelemetry = (event, { socketId, userId = null, error = null }) => {
  structuredLog(error ? 'error' : 'info', `socket_${event}`, {
    socketId,
    userId,
    error: error?.message || error,
  });
};

/**
 * System Readiness Inspector
 */
const getSystemReadiness = () => {
  const mongoStateCode = mongoose.connection?.readyState;
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const mongoReady = mongoStateCode === 1;

  return {
    ready: mongoReady,
    services: {
      mongodb: {
        status: mongoStates[mongoStateCode] || 'unknown',
        ready: mongoReady,
      },
      aiProvider: {
        provider: process.env.NVIDIA_API_KEY
          ? 'nvidia'
          : process.env.GEMINI_API_KEY
            ? 'gemini'
            : 'fallback-local',
        configured: Boolean(process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY),
      },
    },
  };
};

/**
 * Global Error Observability Handler
 */
const observabilityErrorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'no-req-id';
  const userId = req.userId || null;

  structuredLog('error', 'unhandled_error', {
    requestId,
    userId,
    route: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: !isProduction ? err.stack : undefined,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'An unexpected internal error occurred' : err.message,
    requestId,
  });
};

module.exports = {
  getSystemReadiness,
  logAiTelemetry,
  logSocketTelemetry,
  logUploadTelemetry,
  observabilityErrorHandler,
  requestObservability,
  structuredLog,
};
