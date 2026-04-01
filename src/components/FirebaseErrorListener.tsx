
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events
 * and internal Firestore SDK assertion failures.
 * It handles errors silently to prevent brand-damaging UI crashes.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // Add global window listener for Firebase internal assertion errors
    // These often trigger Next.js error overlays in development
    const handleGlobalError = (event: ErrorEvent) => {
      const isSdkAssertion = 
        event.message?.includes('INTERNAL ASSERTION FAILED') || 
        (event.error && String(event.error).includes('INTERNAL ASSERTION FAILED'));
        
      if (isSdkAssertion) {
        console.warn('[RentoVerse] Silenced SDK assertion failure to maintain UI stability.');
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Catch unhandled promise rejections which might contain assertion failures
    const handleRejection = (event: PromiseRejectionEvent) => {
      const isSdkAssertion = event.reason?.message?.includes('INTERNAL ASSERTION FAILED');
      if (isSdkAssertion) {
        console.warn('[RentoVerse] Silenced SDK promise rejection assertion.');
        event.preventDefault();
      }
    };

    const handleError = (error: FirestorePermissionError) => {
      // Log for debugging but do not throw to prevent the Next.js error overlay
      console.warn('[RentoVerse Security] Access restricted:', error.message);
      setError(error);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleRejection);
    errorEmitter.on('permission-error', handleError);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
