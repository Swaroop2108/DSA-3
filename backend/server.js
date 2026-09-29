const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { getDbStatus } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Environment check
const requiredEnvVars = ['JWT_SECRET'];
requiredEnvVars.forEach(v => {
  if (!process.env[v]) {
    console.warn(`⚠️ Warning: Missing environment variable ${v}. Using standard default fallback.`);
  }
});

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Initialize Database Connection & Seed Data
connectDB();

// Health check API endpoint
app.get('/api/health', (req, res) => {
  const dbState = getDbStatus();
  res.json({
    success: true,
    server: 'MediSchedule API',
    database: dbState,
    status: 'healthy',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/beds', require('./routes/bedRoutes'));
app.use('/api/ors', require('./routes/orRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/surgeries', require('./routes/surgeryRoutes'));
app.use('/api/scheduling', require('./routes/schedulingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    project: 'MediSchedule API',
    subtitle: 'Smart Hospital Resource Management & Scheduling System (DSA-3)',
    status: 'ONLINE',
    database: getDbStatus(),
    timestamp: new Date()
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const dbLabel = getDbStatus() === 'connected' ? 'Connected' : 'Development Fallback Mode';
  console.log(`========================================`);
  console.log(`MediSchedule Backend`);
  console.log(`========================================`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Database: ${dbLabel}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Authentication: Ready`);
  console.log(`API: Ready`);
  console.log(`========================================`);
});

