import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║        ImageGen API  —  Running          ║
║  http://localhost:${PORT}                   ║
║  ENV: ${(process.env.NODE_ENV || 'development').padEnd(34)}║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown  
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down gracefully');
  server.close(() => process.exit(0));
});