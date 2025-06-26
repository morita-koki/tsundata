import { verifyFirebaseToken } from '../config/firebase.js';
import { db } from '../config/database.js';
import { users } from '../models/index.js';
import { eq } from 'drizzle-orm';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Firebase IDトークンを検証
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

    req.user = user[0];
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};