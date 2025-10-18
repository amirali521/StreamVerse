// src/firebase/auth/use-user.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  type User,
} from 'firebase/auth';
import { useFirebase } from '../provider';
import { getAuth } from 'firebase/auth';

export type UserContextType = {
  user: User | null;
  claims: any;
  loaded: boolean;
  protectedPaths: string[];
};

export const UserContext = createContext<UserContextType>({
  user: null,
  claims: null,
  loaded: false,
  protectedPaths: [],
});

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export function UserProvider(props: {
  children: ReactNode;
  protectedPaths?: string[];
}) {
  const { app } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const auth = app ? getAuth(app) : null;

  useEffect(() => {
    if (!auth) {
      setLoaded(true);
      return;
    }

    const authStateChanged = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoaded(true);
    });

    const idTokenChanged = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setClaims(null);
        return;
      }
      const token = await user.getIdTokenResult();
      setClaims(token.claims);
    });

    return () => {
      authStateChanged();
      idTokenChanged();
    };
  }, [auth]);

  return (
    <UserContext.Provider
      value={{
        user,
        claims,
        loaded,
        protectedPaths: props.protectedPaths ?? [],
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
