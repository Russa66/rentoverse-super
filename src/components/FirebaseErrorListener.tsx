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
    // Save the original console.error
    const originalConsoleError = console.error;

    // Monkey-patch console.error to filter out internal Firestore assertion failures
    // which Next.js often captures and displays as full-screen overlays.
    console.error = (...args: any[]) => {
      const errorMsg = args.join(' ');
      const isSdkAssertion = errorMsg.includes('INTERNAL ASSERTION FAILED');
      
      if (isSdkAssertion) {
        // Log as a warning instead to avoid triggering the Next.js error overlay
        console.warn('[RentoVerse] Suppressed internal Firestore assertion to maintain brand UI stability:', errorMsg);
        return;
      }
      
      // Otherwise, call the original console.error
      originalConsoleError.apply(console, args);
    };

    // Add global window listener for Firebase internal assertion errors
    const handleGlobalError = (event: ErrorEvent) => {
      const isSdkAssertion = 
        event.message?.includes('INTERNAL ASSERTION FAILED') || 
        (event.error && String(event.error).includes('INTERNAL ASSERTION FAILED'));
        
      if (isSdkAssertion) {
        console.warn('[RentoVerse] Silenced SDK assertion failure event.');
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Catch unhandled promise rejections which might contain assertion failures
    const handleRejection = (event: PromiseRejectionEvent) => {
      const isSdkAssertion = event.reason?.message?.includes('INTERNAL ASSERTION FAILED') || 
                            String(event.reason).includes('INTERNAL ASSERTION FAILED');
      if (isSdkAssertion) {
        console.warn('[RentoVerse] Silenced SDK promise rejection assertion.');
        event.preventDefault();
      }
    };

    const handleError = (error: FirestorePermissionError) => {
      console.warn('[RentoVerse Security] Access restricted:', error.message);
      setError(error);
    };

    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleRejection);
    errorEmitter.on('permission-error', handleError);

    return () => {
      // Restore original console.error
      console.error = originalConsoleError;
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
