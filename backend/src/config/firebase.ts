/**
 * Firebase Admin SDK Configuration
 * Unified Firebase initialization and token verification
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { App } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { 
  FirebaseAuthError, 
  ConfigurationError, 
  EnvironmentVariableError 
} from '../errors/index.js';
import type { FirebaseTokenPayload } from '../types/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp: App | null = null;

/**
 * Service Account configuration interface
 */
interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Validates service account configuration
 */
function validateServiceAccount(serviceAccount: any): ServiceAccountConfig {
  const required = ['type', 'project_id', 'private_key', 'client_email'];
  
  for (const field of required) {
    if (!serviceAccount[field]) {
      throw new ConfigurationError(
        `Missing required field in Firebase service account: ${field}`,
        field
      );
    }
  }
  
  return serviceAccount as ServiceAccountConfig;
}

/**
 * Loads service account from environment variable
 */
function loadServiceAccountFromEnv(): ServiceAccountConfig {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountJson) {
    throw new EnvironmentVariableError('FIREBASE_SERVICE_ACCOUNT_KEY');
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return validateServiceAccount(serviceAccount);
  } catch (error) {
    throw new ConfigurationError(
      'Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY environment variable',
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      { originalError: error }
    );
  }
}

/**
 * Loads service account from file path
 */
function loadServiceAccountFromFile(): ServiceAccountConfig {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  if (!serviceAccountPath) {
    throw new EnvironmentVariableError('FIREBASE_SERVICE_ACCOUNT_PATH');
  }
  
  try {
    const fullPath = path.resolve(__dirname, '../../', serviceAccountPath);
    const serviceAccountJson = readFileSync(fullPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    return validateServiceAccount(serviceAccount);
  } catch (error) {
    throw new ConfigurationError(
      `Failed to load Firebase service account from file: ${serviceAccountPath}`,
      'FIREBASE_SERVICE_ACCOUNT_PATH',
      { originalError: error }
    );
  }
}

/**
 * Initializes Firebase Admin SDK
 */
export function initializeFirebase(): App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    let serviceAccount: ServiceAccountConfig;

    // Try loading from environment variable first
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = loadServiceAccountFromEnv();
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      serviceAccount = loadServiceAccountFromFile();
    } else {
      // In development/test mode, allow running without Firebase
      const nodeEnv = process.env.NODE_ENV || 'development';
      if (nodeEnv === 'development' || nodeEnv === 'test') {
        console.warn('Firebase Admin SDK not configured. Running in development mode.');
        return null;
      }
      
      throw new EnvironmentVariableError('FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof EnvironmentVariableError) {
      throw error;
    }
    
    throw new ConfigurationError(
      'Failed to initialize Firebase Admin SDK',
      'firebase_initialization',
      { originalError: error }
    );
  }
}

/**
 * Verifies Firebase ID token and returns decoded token
 */
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload> {
  if (!firebaseApp) {
    const app = initializeFirebase();
    if (!app) {
      throw new FirebaseAuthError('Firebase not initialized');
    }
    firebaseApp = app;
  }

  try {
    const decodedToken: DecodedIdToken = await admin.auth().verifyIdToken(idToken);
    
    // Convert Firebase DecodedIdToken to our FirebaseTokenPayload type
    const tokenPayload: FirebaseTokenPayload = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
      picture: decodedToken.picture,
      iss: decodedToken.iss,
      aud: decodedToken.aud,
      auth_time: decodedToken.auth_time,
      user_id: decodedToken.user_id || decodedToken.uid,
      sub: decodedToken.sub,
      iat: decodedToken.iat,
      exp: decodedToken.exp,
      email_verified: decodedToken.email_verified,
      firebase: {
        identities: decodedToken.firebase.identities as { email: string[] },
        sign_in_provider: decodedToken.firebase.sign_in_provider,
      },
    };
    
    return tokenPayload;
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      throw new FirebaseAuthError('Firebase token has expired', { code: error.code });
    } else if (error.code === 'auth/id-token-revoked') {
      throw new FirebaseAuthError('Firebase token has been revoked', { code: error.code });
    } else if (error.code === 'auth/invalid-id-token') {
      throw new FirebaseAuthError('Invalid Firebase token format', { code: error.code });
    } else {
      throw new FirebaseAuthError('Firebase token verification failed', {
        code: error.code,
        originalError: error,
      });
    }
  }
}

/**
 * Gets the current Firebase app instance
 */
export function getFirebaseApp(): App | null {
  return firebaseApp;
}

/**
 * Resets Firebase app instance (useful for testing)
 */
export function resetFirebaseApp(): void {
  if (firebaseApp) {
    // Note: In a real application, you might want to properly clean up the app
    firebaseApp = null;
  }
}

export { admin };