import express from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { db } from '../config/database.js';
import { users } from '../models/index.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Firebase認証後のユーザー情報同期
router.post('/sync', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Firebase ID token required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    
    // データベースでユーザーを確認または作成
    let user = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firebaseUid: users.firebaseUid
    }).from(users).where(eq(users.firebaseUid, decodedToken.uid)).limit(1);

    if (user.length === 0) {
      // ユーザーが存在しない場合は作成
      const newUser = await db.insert(users).values({
        firebaseUid: decodedToken.uid,
        username: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({
        id: users.id,
        username: users.username,
        email: users.email,
        firebaseUid: users.firebaseUid
      });
      
      user = newUser;
    }

    res.json({
      user: user[0],
      firebaseUser: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      }
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    res.status(500).json({ error: 'Authentication sync failed' });
  }
});

// ユーザー情報更新
router.patch('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Firebase ID token required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const updatedUser = await db.update(users)
      .set({
        username,
        updatedAt: new Date()
      })
      .where(eq(users.firebaseUid, decodedToken.uid))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        firebaseUid: users.firebaseUid
      });

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: updatedUser[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

export default router;