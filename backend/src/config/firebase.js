import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp;

export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Firebase Admin SDK の初期化
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // 環境変数からサービスアカウントキーを読み込み
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // ファイルパスからサービスアカウントキーを読み込み
      const serviceAccountPath = path.resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // 開発環境用のモック（実際のプロジェクトでは適切な設定が必要）
      console.warn('Firebase Admin SDK not configured. Using development mode.');
      return null;
    }

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

export async function verifyFirebaseToken(idToken) {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
}

export { admin };