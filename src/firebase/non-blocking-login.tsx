'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. 
  // We catch the error to prevent "admin-restricted-operation" from crashing the app.
  signInAnonymously(authInstance).catch(err => {
    console.error("[RentoVerse Auth] Anonymous sign-in failed. Please check if 'Anonymous' provider is enabled in Firebase Console:", err);
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
