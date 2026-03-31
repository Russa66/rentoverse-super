'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  // We return the promise here so callers can handle specific errors like 'admin-restricted-operation'
  return signInAnonymously(authInstance)
    .then(() => {
      console.log("[RentoVerse Auth] Guest session started.");
    })
    .catch(err => {
      if (err.code === 'auth/admin-restricted-operation') {
        console.warn("[RentoVerse Auth] Anonymous auth is disabled in Firebase Console. Guests will see limited data.");
      } else {
        console.error("[RentoVerse Auth] Anonymous sign-in failed:", err);
      }
      throw err; // Re-throw so the UI can respond if needed
    });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(err => {
    console.error("[RentoVerse Auth] Email sign-up failed:", err);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(err => {
    console.error("[RentoVerse Auth] Email sign-in failed:", err);
  });
}
