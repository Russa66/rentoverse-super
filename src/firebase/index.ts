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
    try {
      // Attempt initialization with explicit config for reliability
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase initialization error:', e);
      // Fallback attempt
      app = initializeApp();
    }
  } else {
    app = getApp();
  }

  // Diagnostic Heartbeat - This will show in your browser console (F12)
  console.log(
    `%c RentoVerse System Active %c Project: ${firebaseConfig.projectId} `,
    'background: #22c55e; color: #fff; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 6px;',
    'background: #1e293b; color: #fff; border-radius: 0 4px 4px 0; padding: 2px 6px;'
  );

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
