
'use client';

import { useEffect, useState } from 'react';
import { useUser } from './use-user';
import { useFirestore } from '../provider';
import { doc, getDoc } from 'firebase/firestore';

export function useAdminStatus() {
  const { user, loaded: userLoaded } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userLoaded) {
      setIsLoading(true);
      return;
    }

    if (!user || !firestore) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userIsAdmin = userData?.admin === true;
          const userIsSuperAdmin = userData?.isSuperAdmin === true;

          setIsAdmin(userIsAdmin || userIsSuperAdmin); // A super admin is also an admin
          setIsSuperAdmin(userIsSuperAdmin);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, userLoaded, firestore]);

  return { isAdmin, isSuperAdmin, isLoading };
}
