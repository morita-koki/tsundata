/**
 * Authentication Routes
 * Uses Repository-Service-Controller architecture
 */

import { Router } from 'express';
import type { ControllerContainer } from '../controllers/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateWith, Schemas } from '../validation/index.js';

/**
 * Creates authentication routes
 */
export function createAuthRoutes(controllers: ControllerContainer): Router {
  const router = Router();

  // POST /api/auth/sync - Firebase authentication sync
  router.post('/sync', authMiddleware, controllers.authController.syncUser);

  // GET /api/auth/me - Get current user profile
  router.get('/me', authMiddleware, controllers.authController.getCurrentUser);

  // PUT /api/auth/profile - Update current user profile
  router.put('/profile', authMiddleware, validateWith(Schemas.auth.updateProfile), controllers.authController.updateProfile);

  return router;
}