require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library-system';

// Middleware
// CORS: allow only configured frontend origins (FRONTEND_URLS env var)
const rawFrontendUrls = process.env.FRONTEND_URLS || '';
const allowedOrigins = rawFrontendUrls
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  // Temporarily allow any origin for debugging mobile network issues.
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running correctly.' });
});

app.get('/', (req, res) => {
  res.send('Library Management System API');
});

// Import API Routes
const bookRoutes = require('./routes/book.routes');
const requestRoutes = require('./routes/request.routes');
const authRoutes = require('./routes/auth.routes');
const reservationRoutes = require('./routes/reservation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const fineRoutes = require('./routes/fine.routes');
const aiRoutes = require('./routes/ai.routes');
const aiRecommendRoutes = require('./routes/aiRecommendRoutes');
const aiDocumentRoutes = require('./routes/aiDocumentRoutes');
const aiRoadmapRoutes = require('./routes/aiRoadmapRoutes');
const aiAlgorithmRoutes = require('./routes/aiAlgorithmRoutes');
const aiNotificationRoutes = require('./routes/aiNotificationRoutes');
const aiTeacherRoutes = require('./routes/aiTeacherRoutes');
const analyticsRoutes = require('./routes/analytics.routes');

const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: { message: 'Too many requests to AI services, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount Routes
app.use('/api/ai', aiRateLimiter);
app.use('/api/books', bookRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/recommend', aiRecommendRoutes);
app.use('/api/ai/document', aiDocumentRoutes);
app.use('/api/ai/roadmap', aiRoadmapRoutes);
app.use('/api/ai/algorithms', aiAlgorithmRoutes);
app.use('/api/ai/notifications', aiNotificationRoutes);
app.use('/api/ai/teacher', aiTeacherRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Server & Connect MongoDB
async function startServer(customUri) {
  const uri = customUri || MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // --- Startup Database Priority Repair ---
    try {
      const User = require('./models/User');
      const Reservation = require('./models/Reservation');

      const calculateUserPriority = (role, customId, designation) => {
        const normalizedRole = String(role || '').trim().toLowerCase();
        if (normalizedRole === 'teacher') {
          const designationWeights = {
            'professor': 1005,
            'associate professor': 1004,
            'assistant professor': 1003,
            'lecturer': 1002,
            'adjunct lecturer': 1001
          };
          const normDesignation = String(designation || '').trim().toLowerCase();
          return designationWeights[normDesignation] || 1000;
        }
        if (normalizedRole === 'student') {
          const prefixes = ['C', 'E', 'T', 'CE', 'EL', 'L', 'B', 'P'];
          const id = String(customId || '').trim().toUpperCase();
          const matchedPrefix = prefixes
            .sort((a, b) => b.length - a.length)
            .find(prefix => id.startsWith(prefix));
          if (matchedPrefix) {
            const idAfterPrefix = id.substring(matchedPrefix.length);
            const batchCodeMatch = idAfterPrefix.match(/^\d{3}/);
            if (batchCodeMatch) {
              const batchCode = parseInt(batchCodeMatch[0], 10);
              return 1000 - batchCode;
            }
          }
        }
        return 0;
      };

      const usersToRepair = await User.find({
        $or: [
          { priorityLevel: 0 },
          { priorityLevel: { $exists: false } }
        ]
      });

      let updatedCount = 0;
      for (const u of usersToRepair) {
        const normRole = String(u.role || '').toLowerCase();
        if (normRole !== 'student' && normRole !== 'teacher') continue;
        const calc = calculateUserPriority(u.role, u.customId, u.designation);
        if (calc > 0) {
          u.priorityLevel = calc;
          await u.save();
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`[Database Repair] Successfully repaired priorityLevel for ${updatedCount} users.`);
      }

      // Also repair active reservations priority values to align with fixed user priorities
      const reservationsToRepair = await Reservation.find({
        status: 'Waiting'
      }).populate('user');

      let repairedReservationsCount = 0;
      for (const resv of reservationsToRepair) {
        if (resv.user && resv.user.priorityLevel > 0 && resv.priorityLevel !== resv.user.priorityLevel) {
          resv.priorityLevel = resv.user.priorityLevel;
          await resv.save();
          repairedReservationsCount++;
        }
      }
      if (repairedReservationsCount > 0) {
        console.log(`[Database Repair] Successfully repaired priorityLevel for ${repairedReservationsCount} active reservations.`);
      }
    } catch (repairErr) {
      console.error('[Database Repair] Priority level repair error:', repairErr);
    }
    // ----------------------------------------

  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // start background jobs (cron) if available
  try {
    const jobs = require('./jobs/dailyFinesAndNotifications');
    if (jobs && typeof jobs.startJobs === 'function') {
      jobs.startJobs().catch(err => console.error('Jobs failed to start:', err));
    }
    const dueJobs = require('./jobs/dueDateCheckerJob');
    if (dueJobs && typeof dueJobs.startJobs === 'function') {
      dueJobs.startJobs().catch(err => console.error('Due Date Jobs failed to start:', err));
    }
  } catch (err) {
    // ignore if job module not present or errors
  }

  return { app, server };
}

// If this file is run directly, start the server immediately
if (require.main === module) {
  startServer().catch(err => console.error('Failed to start server', err));
}

module.exports = { app, startServer };
