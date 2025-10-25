// src/firebase/index.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseConfig } from './config';
import { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';

export function initializeFirebase() {
  const firebaseConfig = getFirebaseConfig();
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  
  // Enable offline persistence
  enableIndexedDbPersistence(firestore)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence not available in this browser.');
      }
    });

  return { app, firestore, auth };
}

export {
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
