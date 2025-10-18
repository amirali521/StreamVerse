
// src/firebase/server.ts
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

export function initializeFirebase(): { app: App, firestore: Firestore, auth: Auth } {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  return { app, firestore, auth };
}
