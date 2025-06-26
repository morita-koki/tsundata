import express from 'express';
import { db } from '../config/database.js';
import { users, userBooks, books, follows, blocks } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, and, sql, not, inArray } from 'drizzle-orm';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await db.select({
      totalBooks: sql`COUNT(*)`,
      unreadBooks: sql`SUM(CASE WHEN ${userBooks.isRead} = 0 THEN 1 ELSE 0 END)`,
      readBooks: sql`SUM(CASE WHEN ${userBooks.isRead} = 1 THEN 1 ELSE 0 END)`,
      totalValue: sql`SUM(${books.price})`,
      unreadValue: sql`SUM(CASE WHEN ${userBooks.isRead} = 0 THEN ${books.price} ELSE 0 END)`
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBooks.userId, userId));

    res.json(stats[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

router.post('/follow/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const followerId = req.user.id;

    if (followerId === parseInt(targetUserId)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existingFollow = await db.select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, targetUserId)))
      .limit(1);

    if (existingFollow.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const newFollow = await db.insert(follows).values({
      followerId,
      followingId: parseInt(targetUserId),
      createdAt: new Date()
    }).returning();

    res.status(201).json(newFollow[0]);
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

router.delete('/unfollow/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const followerId = req.user.id;

    const deletedFollow = await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, targetUserId)))
      .returning();

    if (deletedFollow.length === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

router.post('/block/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const blockerId = req.user.id;

    if (blockerId === parseInt(targetUserId)) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const existingBlock = await db.select()
      .from(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, targetUserId)))
      .limit(1);

    if (existingBlock.length > 0) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    await db.delete(follows)
      .where(and(eq(follows.followerId, blockerId), eq(follows.followingId, targetUserId)));

    await db.delete(follows)
      .where(and(eq(follows.followerId, targetUserId), eq(follows.followingId, blockerId)));

    const newBlock = await db.insert(blocks).values({
      blockerId,
      blockedId: parseInt(targetUserId),
      createdAt: new Date()
    }).returning();

    res.status(201).json(newBlock[0]);
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.delete('/unblock/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const blockerId = req.user.id;

    const deletedBlock = await db.delete(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, targetUserId)))
      .returning();

    if (deletedBlock.length === 0) {
      return res.status(404).json({ error: 'User not blocked' });
    }

    res.json({ message: 'Unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const blockedUsers = await db.select({ id: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, currentUserId));

    const blockedUserIds = blockedUsers.map(b => b.id);

    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email
    })
    .from(users)
    .where(sql`${users.username} LIKE ${'%' + q + '%'} AND ${users.id} != ${currentUserId}`);

    if (blockedUserIds.length > 0) {
      query = query.where(not(inArray(users.id, blockedUserIds)));
    }

    const searchResults = await query.limit(10);

    res.json(searchResults);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;