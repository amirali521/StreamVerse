
// src/firebase/server.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirebaseConfig } from './config';
import * as admin from 'firebase-admin';

// This is a server-side only file.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

let app: App | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

if (serviceAccount) {
    if (!getApps().length) {
        app = initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${getFirebaseConfig().projectId}.firebaseio.com`,
        });
    } else {
        app = getApp();
    }
    if (app) {
        firestore = getFirestore(app);
        auth = getAuth(app);
    }
}


export function initializeFirebase() {
  if (!app || !firestore || !auth) {
    // This is a fallback for local development where service account might not be set.
    // It prevents crashing but server-side rendering with Firestore will not work.
    // In a deployed environment, the service account should always be available.
    console.warn("Firebase Admin SDK not initialized. Server-side Firestore operations will not work.");
    // Return mock/empty objects to prevent crashing downstream
    return { app: null, firestore: null, auth: null };
  }
  return { app, firestore, auth };
}
