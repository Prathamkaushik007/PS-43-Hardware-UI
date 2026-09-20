import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { videoRouter } from './routes/video.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use('/api/videos', videoRouter);

// Base health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PS-43 Kiosk Backend running on http://localhost:${PORT}`);
  console.log(`Allowed Frontend Origin: ${FRONTEND_URL}`);
});
