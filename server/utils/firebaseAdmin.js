import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultServiceAccountPath = path.resolve(__dirname, '../artncraft-ac7ae-firebase-adminsdk-fbsvc-599ca53d9e.json');
const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
let firebaseInitialized = false;

function loadServiceAccount() {
  if (envJson) {
    try {
      return JSON.parse(envJson);
    } catch (error) {
      console.error('Unable to parse FIREBASE_SERVICE_ACCOUNT_JSON', error);
      return null;
    }
  }

  const serviceAccountPath = envPath || (fs.existsSync(defaultServiceAccountPath) ? defaultServiceAccountPath : null);
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
      return JSON.parse(fileContents);
    } catch (error) {
      console.error('Unable to load Firebase service account file', error);
      return null;
    }
  }

  return null;
}

function initializeFirebaseAdmin() {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    return;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    firebaseInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK', error);
  }
}

initializeFirebaseAdmin();

export function isFirebaseAdminAvailable() {
  return firebaseInitialized;
}

export async function verifyFirebaseToken(token) {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin is not initialized');
  }
  return admin.auth().verifyIdToken(token);
}
