/**
 * Main application entry point
 * Uses Repository-Service-Controller architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import { createRepositoryContainer } from './repositories/index.js';
import { createServiceContainer } from './services/index.js';
import { createControllerContainer } from './controllers/index.js';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

/**
 * Initialize application with dependency injection
 */
async function initializeApp() {
  // Initialize external dependencies
  await initializeDatabase();
  initializeFirebase();

  // Create dependency containers using Repository-Service-Controller pattern
  const repositories = createRepositoryContainer();
  const services = createServiceContainer(repositories);
  const controllers = createControllerContainer(services);
  const routes = createRoutes(controllers);

  // Mount routes
  app.use('/api/auth', routes.authRoutes);
  app.use('/api/books', routes.bookRoutes);
  app.use('/api/users', routes.userRoutes);
  app.use('/api/bookshelves', routes.bookshelfRoutes);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      architecture: 'Repository-Service-Controller'
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    await initializeApp();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`🏗️  Architecture: Repository-Service-Controller`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();