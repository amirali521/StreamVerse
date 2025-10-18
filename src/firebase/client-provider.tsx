// src/firebase/client-provider.tsx
'use client';
import { initializeFirebase } from '.';
import { FirebaseProvider, FirebaseProviderProps } from './provider';
import { ReactNode, useEffect, useState } from 'react';
import { UserProvider } from './auth/use-user';

export function FirebaseClientProvider(props: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseProviderProps | null>(null);
  useEffect(() => {
    const fb = initializeFirebase();
    setFirebase(fb);
  }, []);
  if (!firebase) {
    return null;
  }
  return (
    <FirebaseProvider {...firebase}>
      <UserProvider>{props.children}</UserProvider>
    </FirebaseProvider>
  );
}
