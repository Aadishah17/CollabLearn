const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
require('dotenv').config();
const { connectDB, resolveMongoUri } = require('./db');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 5001;
const uploadsPath = path.join(__dirname, '..', 'uploads');
const avatarUploadsPath = path.join(uploadsPath, 'avatars');
const sessionDocumentUploadsPath = path.join(uploadsPath, 'session-documents');

const parseAllowedOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3000'
  ];

  const configured = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : defaults;
};

const allowedOrigins = parseAllowedOrigins();

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
if (!fs.existsSync(avatarUploadsPath)) {
  fs.mkdirSync(avatarUploadsPath, { recursive: true });
}
if (!fs.existsSync(sessionDocumentUploadsPath)) {
  fs.mkdirSync(sessionDocumentUploadsPath, { recursive: true });
}

console.log('-----------------------------------------');
console.log('DEBUG: SERVER STARTUP');
console.log('DEBUG: Loaded .env via dotenv');
console.log('DEBUG: GEMINI_API_KEY Present?', !!process.env.GEMINI_API_KEY);
console.log('DEBUG: CORS_ORIGINS:', allowedOrigins.join(', '));
console.log('-----------------------------------------');

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

io.on('connection', (socket) => {
  socket.on('user_online', (userId) => {
    if (!userId) return;

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
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit('user_status_change', { userId: socket.userId, isOnline: false });
  });
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(uploadsPath));

console.log('Attempting to connect to MongoDB:', resolveMongoUri());
connectDB();

mongoose.connection.on('error', (error) => console.error('MongoDB error:', error));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

app.get('/api/users', async (_req, res) => {
  try {
    const users = await User.find({}, '_id name email');
    res.json(users);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ time: 1 });
    res.json(messages);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateLabelMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    success: true,
    status: 'ok',
    db: dbStateLabelMap[dbState] || 'unknown'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/modules', require('./routes/moduleRoutes'));

console.log('All routes loaded');

app.get('/', (_req, res) => {
  res.json({ message: 'CollabLearn API Running!' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
