'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Tree } from '@/types';

export function useTrees() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'trees'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const treesData: Tree[] = [];
        querySnapshot.forEach((doc) => {
          treesData.push({ id: doc.id, ...doc.data() } as Tree);
        });
        setTrees(treesData);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { trees, loading, error };
}
