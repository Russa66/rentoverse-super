'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Initializes Firebase and returns the core SDK instances.
 * Includes explicit logging for connectivity verification.
 */
export function initializeFirebase() {
  let app: FirebaseApp;

  if (!getApps().length) {
    console.log('[Firebase] Initializing with Project ID:', firebaseConfig.projectId);
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Diagnostic log that appears in the browser console (F12)
  console.log('✅ RentoVerse Firebase Connected:', firebaseConfig.projectId);

  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
