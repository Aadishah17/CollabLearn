const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { connectDB, resolveMongoUri, getMongoConnectionState } = require('./db');
const { assertJwtSecretConfigured } = require('./config/auth');
const { ensureUploadDirectories, uploadsPath } = require('./config/storage');
const auth = require('./middleware/auth');
const { createRateLimiter } = require('./middleware/rateLimit');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 5001;
const isProduction = String(process.env.NODE_ENV || '').trim() === 'production';
const isTruthyEnv = (value) => /^(1|true|yes|on)$/i.test(String(value || '').trim());
const debugStartupLogs = isTruthyEnv(process.env.DEBUG_SERVER_STARTUP_LOGS);
const debugSocketLogs = isTruthyEnv(process.env.DEBUG_SOCKET_LOGS);
const logStartup = (...args) => {
  if (debugStartupLogs) {
    console.log(...args);
  }
};
const logSocket = (...args) => {
  if (debugSocketLogs) {
    console.log(...args);
  }
};

const normalizeOriginEntry = (origin) => {
  const trimmed = String(origin || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
};

const parseAllowedOrigins = () => {
  const defaults = [
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5176',
    'http://localhost:5177',
    'http://127.0.0.1:5177',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const configured = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOriginEntry(origin))
    .filter(Boolean);

  return configured.length > 0 ? configured : defaults;
};

const resolveTrustProxy = () => {
  const configured = String(process.env.TRUST_PROXY || '').trim();
  if (!configured) {
    return null;
  }

  if (/^(true|1)$/i.test(configured)) {
    return 1;
  }

  if (/^(false|0)$/i.test(configured)) {
    return false;
  }

  const numeric = Number.parseInt(configured, 10);
  return Number.isInteger(numeric) ? numeric : configured;
};

const allowedOrigins = parseAllowedOrigins();
const trustProxy = resolveTrustProxy();
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204
};
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication requests. Please try again later.'
});
const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many AI requests. Please slow down and try again shortly.'
});

ensureUploadDirectories();

const initializeApp = (options = {}) => {
  assertJwtSecretConfigured();
  return connectDB(options);
};

logStartup('-----------------------------------------');
logStartup('DEBUG: SERVER STARTUP');
logStartup('DEBUG: Loaded .env via dotenv');
logStartup('DEBUG: External AI provider key present?', !!process.env.GEMINI_API_KEY);
logStartup('DEBUG: CORS_ORIGINS:', allowedOrigins.join(', '));
logStartup('-----------------------------------------');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const User = require('./models/User');
const Message = require('./models/Message');

const onlineUsers = new Map();

app.disable('x-powered-by');
if (trustProxy !== null) {
  app.set('trust proxy', trustProxy);
}

io.on('connection', (socket) => {
  socket.on('user_online', (userId) => {
    if (!userId) return;

    logSocket(`User online: ${userId} (Socket: ${socket.id})`);
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;

    socket.emit('online_users_list', { onlineUsers: Array.from(onlineUsers.keys()) });
    socket.broadcast.emit('user_status_change', { userId, isOnline: true });
  });

  socket.on('joinRoom', (chatId) => {
    socket.join(chatId);
  });

  socket.on('leaveRoom', (chatId) => {
    socket.leave(chatId);
  });

  socket.on('chat message', async (msg) => {
    try {
      const saved = await Message.create(msg);
      socket.to(msg.chatId).emit('chat message', saved);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user typing', data);
  });

  socket.on('stopped typing', (data) => {
    socket.to(data.chatId).emit('user stopped typing', data);
  });

  socket.on('disconnect', () => {
    if (!socket.userId) return;
    logSocket(`User disconnected: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit('user_status_change', { userId: socket.userId, isOnline: false });
  });
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors(corsOptions));
app.use((error, _req, res, next) => {
  if (error?.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed'
    });
  }

  return next(error);
});

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(
  '/uploads',
  express.static(uploadsPath, {
    etag: true,
    maxAge: isProduction ? '1d' : 0
  })
);

mongoose.connection.on('error', (error) => console.error('MongoDB error:', error));
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

app.get('/api/users', auth, async (_req, res) => {
  try {
    const users = await User.find({}, '_id name email');
    res.json(users);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/messages/:chatId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ time: 1 });
    res.json(messages);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/health', (_req, res) => {
  const mongoState = getMongoConnectionState();
  const dbState = mongoState.readyState;
  const dbStateLabelMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbStatus = dbStateLabelMap[dbState] || 'unknown';

  res.json({
    success: true,
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    db: dbStatus,
    dbStatus,
    mongo: mongoState,
    services: {
      api: 'ok',
      database: dbStatus
    }
  });
});

app.use('/api/auth', authRateLimiter, require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/public', require('./routes/public'));
app.use('/api/ai', aiRateLimiter, require('./routes/ai'));
app.use('/api/modules', require('./routes/moduleRoutes'));

app.get('/', (_req, res) => {
  res.json({ message: 'CollabLearn API Running!' });
});

if (require.main === module) {
  logStartup('Attempting to connect to MongoDB:', resolveMongoUri());
  void initializeApp();

  server.listen(PORT, '0.0.0.0', () => {
    logStartup(`Server running on port ${PORT}`);
    logStartup(`Local: http://localhost:${PORT}`);
  });
}

app.initializeApp = initializeApp;
app.server = server;

module.exports = app;
