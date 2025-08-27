const express = require('express');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const shippingRoutes = require('./routes/shipping');
const userRoutes = require('./routes/users');
const exportRoutes = require('./routes/exports');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // 명시적 세션 이름
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 디버그 미들웨어 추가
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '배송접수 웹앱 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      shipping: '/api/shipping',
      users: '/api/users',
      exports: '/api/exports'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exports', exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});