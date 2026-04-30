// Admin settings — a single document keyed by 'school' for V1.
// In a future multi-school version, this would be keyed by schoolId.

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
  } from 'firebase/firestore';
  import { db, firebaseEnabled } from '../firebase/config.js';
  
  const KEY = 'all_admin_settings_v1';
  const FIRESTORE_DOC_ID = 'school';
  
  export const DEFAULT_SETTINGS = {
    rawCommentsVisibleToManagement: false,
    retentionDays: 365,
    aiSummariesEnabled: true,
  };
  
  export async function getSettings() {
    if (firebaseEnabled && db) {
      const ref = doc(db, 'settings', FIRESTORE_DOC_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...snap.data() };
    }
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
  
  export async function saveSettings(patch) {
    if (firebaseEnabled && db) {
      const ref = doc(db, 'settings', FIRESTORE_DOC_ID);
      await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
      return getSettings();
    }
    const current = await getSettings();
    const next = { ...current, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }