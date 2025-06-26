import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase アプリの初期化
const app = initializeApp(firebaseConfig);

// Auth インスタンス
export const auth = getAuth(app);

// 開発環境でAuth Emulatorを使用する場合（オプション）
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;