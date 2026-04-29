import express         from 'express';
import cors            from 'cors';
import helmet          from 'helmet';
import morgan          from 'morgan';
import path            from 'path';
import { fileURLToPath } from 'url';

import { globalLimiter }  from './middleware/rateLimiter.js';
import { errorHandler }   from './middleware/errorHandler.js';
import { notFound }       from './middleware/notFound.js';

import authRoutes      from './routes/auth.js';
import generateRoutes  from './routes/generate.js';
import galleryRoutes   from './routes/gallery.js';
import creditsRoutes   from './routes/credits.js';
import uploadRoutes    from './routes/upload.js';
import healthRoutes    from './routes/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

/* ─────────────────────────────────────────
   SECURITY & CORS
───────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ─────────────────────────────────────────
   BODY PARSING & LOGGING
───────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ─────────────────────────────────────────
   GLOBAL RATE LIMIT
───────────────────────────────────────── */
app.use(globalLimiter);

/* ─────────────────────────────────────────
   STATIC FILES
───────────────────────────────────────── */
app.use('/uploads',   express.static(path.join(__dirname, '..', 'uploads')));
app.use('/generated', express.static(path.join(__dirname, '..', 'generated')));

/* ─────────────────────────────────────────
   API ROUTES
───────────────────────────────────────── */
const API = '/api/v1';
app.use(`${API}/health`,   healthRoutes);
app.use(`${API}/auth`,     authRoutes);
app.use(`${API}/generate`, generateRoutes);
app.use(`${API}/gallery`,  galleryRoutes);
app.use(`${API}/credits`,  creditsRoutes);
app.use(`${API}/upload`,   uploadRoutes);

/* ─────────────────────────────────────────
   ERROR HANDLING
───────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

export default app;