require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { execSync } = require('child_process');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Run migrations on startup (Railway deployment)
async function runMigrations() {
  if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration error:', error.message);
      // Continue anyway - migrations might already be applied
    }
  }
}

// Import routes
const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/user');
const adminRoutes = require('./server/routes/admin');
const messageRoutes = require('./server/routes/message');
const settingsRoutes = require('./server/routes/settings');

// Import socket handlers
const socketHandlers = require('./server/services/socketService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Socket.IO setup
io.on('connection', (socket) => {
  socketHandlers(io, socket, prisma);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Daxili server xətası',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Səhifə tapılmadı' });
});

// Start server
const PORT = process.env.PORT || 3000;

// Run migrations first, then start server
(async () => {
  await runMigrations();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ${PORT} portunda işləyir`);
    console.log(`🕐 Timezone: ${process.env.TZ || 'Asia/Baku'}`);
    console.log(`📅 Başlama vaxtı: ${new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}`);
  });
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal alındı, server bağlanır...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server bağlandı');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal alındı, server bağlanır...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server bağlandı');
    process.exit(0);
  });
});

module.exports = { app, server, io, prisma };
