import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

/**
 * Atomically generates the next sequential Order Number: "G-1001", "G-1002", etc.
 * Uses Firestore runTransaction so no race condition can ever produce duplicate IDs.
 */
export async function getNextOrderNumber(): Promise<string> {
  const counterRef = doc(db, 'settings', 'counters');

  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    let current = 1000;
    if (counterSnap.exists()) {
      current = counterSnap.data().lastOrderNumber || 1000;
    }

    const next = current + 1;
    transaction.set(
      counterRef,
      {
        lastOrderNumber: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return next;
  });

  return `G-${nextNumber}`;
}

/**
 * Atomically generates the next sequential Product ID: "P-1001", "P-1002", etc.
 */
export async function getNextProductNumber(): Promise<string> {
  const counterRef = doc(db, 'settings', 'counters');

  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    let current = 1000;
    if (counterSnap.exists()) {
      current = counterSnap.data().lastProductNumber || 1000;
    }

    const next = current + 1;
    transaction.set(
      counterRef,
      {
        lastProductNumber: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return next;
  });

  return `P-${nextNumber}`;
}

/**
 * Atomically generates the next sequential Rider ID: "RIDER-01", "RIDER-02", etc.
 */
export async function getNextRiderNumber(): Promise<string> {
  const counterRef = doc(db, 'settings', 'counters');

  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    let current = 0;
    if (counterSnap.exists()) {
      current = counterSnap.data().lastRiderNumber || 0;
    }

    const next = current + 1;
    transaction.set(
      counterRef,
      {
        lastRiderNumber: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return next;
  });

  const padded = nextNumber.toString().padStart(2, '0');
  return `RIDER-${padded}`;
}
