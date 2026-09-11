import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import applicationsRouter from './routes/applications.js';
import savedJobsRouter from './routes/savedJobs.js';
import interviewsRouter from './routes/interviews.js';
import profileRouter from './routes/profile.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/applications', applicationsRouter);
app.use('/api/saved-jobs', savedJobsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/auth', authRouter);

// Health-Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'ok',
      service: 'Job & Internship Tracker API',
      message: 'Backend server is running smoothly',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'Job & Internship Tracker API',
      message: 'Database connection failed',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint for simple browser check
app.get('/', (req, res) => {
  res.send('Job & Internship Tracker API is running. Check /api/health for system status.');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
