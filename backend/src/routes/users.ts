/**
 * User Routes
 * Uses Repository-Service-Controller architecture
 */

import { Router } from 'express';
import type { ControllerContainer } from '../controllers/index.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * Creates user routes
 */
export function createUserRoutes(controllers: ControllerContainer): Router {
  const router = Router();

  // GET /api/users/search - Search for users
  router.get('/search', authMiddleware, controllers.userController.searchUsers);

  // GET /api/users/me - Get current user details
  router.get('/me', authMiddleware, controllers.userController.getCurrentUser);

  // GET /api/users/me/stats - Get current user statistics
  router.get('/me/stats', authMiddleware, controllers.userController.getCurrentUserStats);

  // DELETE /api/users/me - Delete current user account
  router.delete('/me', authMiddleware, controllers.userController.deleteAccount);

  // GET /api/users/:id - Get user details by ID
  router.get('/:id', authMiddleware, controllers.userController.getUserById);

  // GET /api/users/:id/stats - Get user statistics by ID
  router.get('/:id/stats', authMiddleware, controllers.userController.getUserStats);

  // POST /api/users/:id/follow - Follow a user
  router.post('/:id/follow', authMiddleware, controllers.userController.followUser);

  // DELETE /api/users/:id/follow - Unfollow a user
  router.delete('/:id/follow', authMiddleware, controllers.userController.unfollowUser);

  // POST /api/users/:id/block - Block a user
  router.post('/:id/block', authMiddleware, controllers.userController.blockUser);

  // DELETE /api/users/:id/block - Unblock a user
  router.delete('/:id/block', authMiddleware, controllers.userController.unblockUser);

  // GET /api/users/:id/following-status - Check following/blocking status
  router.get('/:id/following-status', authMiddleware, controllers.userController.getFollowingStatus);

  return router;
}