// src/firebase/provider.tsx
'use client';
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

export interface FirebaseProviderProps {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseProviderProps | undefined>(
  undefined,
);

export function FirebaseProvider(
  props: FirebaseProviderProps & { children: ReactNode },
) {
  const { children, ...firebase } = props;
  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;
