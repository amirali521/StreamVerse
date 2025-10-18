
// src/firebase/server.ts
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let firestore: Firestore;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp();
} else {
    app = getApp();
}

firestore = getFirestore(app);
auth = getAuth(app);


export function initializeFirebase() {
  return { app, firestore, auth };
}
