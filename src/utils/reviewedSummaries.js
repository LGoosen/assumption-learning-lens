// Reviewed summaries written by Management after using an external AI
// tool (e.g. NotebookLM, Gemini Gem) to draft text from aggregated data.
//
// Storage shape:
//   reviewedSummaries/{summaryId}
//     {
//       cycleId, classId, subject, grade,
//       strengths, growthAreas, threeShifts,
//       reviewerUid, reviewerName,
//       reviewedAt, updatedAt
//     }
//
// Doc id pattern: `${cycleId}__${classId}` so there's exactly one per
// cycle+class. Re-saving overwrites in place.

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    setDoc,
    serverTimestamp,
    Timestamp,
  } from 'firebase/firestore';
  import { db, firebaseEnabled } from '../firebase/config.js';
  
  const KEY = 'all_reviewed_summaries_v1';
  
  function loadDemo() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  
  function saveDemo(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  
  function toIso(value) {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
    return value;
  }
  
  function buildId({ cycleId, classId }) {
    return `${cycleId}__${classId}`;
  }
  
  // ---------- public API ----------
  
  export async function getReviewedSummary({ cycleId, classId }) {
    if (!cycleId || !classId) return null;
    const id = buildId({ cycleId, classId });
  
    if (firebaseEnabled && db) {
      const ref = doc(db, 'reviewedSummaries', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id,
        ...data,
        reviewedAt: toIso(data.reviewedAt),
        updatedAt: toIso(data.updatedAt),
      };
    }
    return loadDemo().find((s) => s.id === id) || null;
  }
  
  export async function listReviewedSummariesForCycle(cycleId) {
    if (!cycleId) return [];
  
    if (firebaseEnabled && db) {
      const q = query(
        collection(db, 'reviewedSummaries'),
        where('cycleId', '==', cycleId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        reviewedAt: toIso(d.data().reviewedAt),
        updatedAt: toIso(d.data().updatedAt),
      }));
    }
  
    return loadDemo().filter((s) => s.cycleId === cycleId);
  }
  
  export async function saveReviewedSummary(payload) {
    const id = buildId(payload);
    const data = {
      cycleId: payload.cycleId,
      classId: payload.classId,
      subject: payload.subject || '',
      grade: payload.grade || '',
      strengths: payload.strengths || '',
      growthAreas: payload.growthAreas || '',
      threeShifts: payload.threeShifts || '',
      reviewerUid: payload.reviewerUid || '',
      reviewerName: payload.reviewerName || '',
      reviewedConfirmed: Boolean(payload.reviewedConfirmed),
    };
  
    if (firebaseEnabled && db) {
      const ref = doc(db, 'reviewedSummaries', id);
      const snap = await getDoc(ref);
      const isNew = !snap.exists();
      await setDoc(
        ref,
        {
          ...data,
          ...(isNew ? { reviewedAt: serverTimestamp() } : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { id, ...data, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
  
    // demo mode
    const all = loadDemo();
    const without = all.filter((s) => s.id !== id);
    const existing = all.find((s) => s.id === id);
    const next = {
      id,
      ...data,
      reviewedAt: existing?.reviewedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDemo([...without, next]);
    return next;
  }