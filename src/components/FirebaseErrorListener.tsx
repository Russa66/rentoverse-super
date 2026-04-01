
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It handles errors silently to prevent brand-damaging UI crashes.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // Add global window listener for Firebase internal assertion errors
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.warn('[RentoVerse] Handled SDK assertion silently.');
        event.preventDefault();
      }
    };

    const handleError = (error: FirestorePermissionError) => {
      // Log for debugging but do not throw to prevent the Next.js error overlay
      console.warn('[RentoVerse Security] Access restricted:', error.message);
      setError(error);
    };

    window.addEventListener('error', handleGlobalError);
    errorEmitter.on('permission-error', handleError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
