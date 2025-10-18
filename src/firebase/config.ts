// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCsE4G-BjopWnx7Nx1xXnRjdteGOK6tr7I",
  authDomain: "studio-490478735-1510e.firebaseapp.com",
  projectId: "studio-490478735-1510e",
  storageBucket: "studio-490478735-1510e.appspot.com",
  messagingSenderId: "1054513097157",
  appId: "1:1054513097157:web:eb3e16a9a4572c202783ac"
};

export function getFirebaseConfig() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Missing Firebase config');
  }
  return firebaseConfig;
}
