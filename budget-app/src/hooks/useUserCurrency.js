import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export function useUserCurrency() {
  const [currency, setCurrency] = useState('INR'); // Default to INR
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setCurrency('INR');
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setCurrency(userData.currency || 'INR');
        } else {
          setCurrency('INR');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user currency:', error);
        setCurrency('INR');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { currency, loading };
}