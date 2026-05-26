require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library-system';

// Middleware
app.use(cors());
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
const analyticsRoutes = require('./routes/analytics.routes');

// Mount Routes
app.use('/api/books', bookRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Server & Connect MongoDB
async function startServer(customUri) {
  const uri = customUri || MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
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
