import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import { createServices } from './services/index.js';
import { createControllers } from './controllers/index.js';
import { createRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup global error handlers
setupGlobalErrorHandlers();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize architecture components
const services = createServices();
const controllers = createControllers(services);
const routes = createRoutes(controllers);

// Mount routes
app.use('/api/auth', routes.authRoutes);
app.use('/api/books', routes.bookRoutes);
app.use('/api/users', routes.userRoutes);
app.use('/api/bookshelves', routes.bookshelfRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    initializeFirebase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();