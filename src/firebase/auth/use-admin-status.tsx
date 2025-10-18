
'use client';

import { useEffect, useState } from 'react';
import { useUser } from './use-user';
import { useFirestore } from '../provider';
import { doc, getDoc } from 'firebase/firestore';

export function useAdminStatus() {
  const { user, loaded: userLoaded } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userLoaded) {
      setIsLoading(true);
      return;
    }

    if (!user || !firestore) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      setIsLoading(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data()?.admin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAdminStatus();
  }, [user, userLoaded, firestore]);

  return { isAdmin, isLoading };
}
