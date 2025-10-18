
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
  type User,
} from 'firebase/auth';
import { useFirebase } from '../provider';
import { getAuth } from 'firebase/auth';

export type UserContextType = {
  user: User | null;
  loaded: boolean;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  loaded: false,
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
}) {
  const { app } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const auth = app ? getAuth(app) : null;

  useEffect(() => {
    if (!auth) {
      setLoaded(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoaded(true);
    });

    return () => {
      unsubscribe();
    };
  }, [auth]);

  return (
    <UserContext.Provider
      value={{
        user,
        loaded,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
