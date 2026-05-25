import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './server/routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors()); // Allow all cross-origin requests
app.disable('x-powered-by');

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." }
});
app.use('/api/', apiLimiter);

// Compression & Body parsing
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend (vanilla HTML/JS)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// API Routes
app.use('/api', apiRoutes);

// Health Check Endpoint (Render requires)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback to index.html for UI routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(` Server Details `);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================`);
});

// Graceful Shutdown Handling
const shutdown = () => {
  console.log('\nGracefully shutting down server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
