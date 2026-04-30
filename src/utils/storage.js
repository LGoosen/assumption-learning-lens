// Unified storage layer.
//
// Why this exists: Phase 1 made the app runnable in two modes —
//   1) Firebase configured  -> reads/writes go to Firestore
//   2) Demo mode (no env)   -> reads/writes go to localStorage
//
// Components shouldn't care which mode they're in. They just call these
// helpers and get the same shape of data back.
//
// Firestore is the source of truth in production. Demo mode is for
// classroom testing, StackBlitz preview, and prototype review.

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    Timestamp,
  } from 'firebase/firestore';
  import { db, firebaseEnabled } from '../firebase/config.js';
  import { SAMPLE_SUBMISSIONS } from '../data/mockData.js';
  
  const SUBMISSIONS_KEY = 'all_submissions_v1';
  
  // ---------- demo helpers ----------
  function loadDemoSubmissions() {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      if (!raw) return [...SAMPLE_SUBMISSIONS];
      const stored = JSON.parse(raw);
      // Always include the seeded sample submissions so dashboards still look populated.
      const seenIds = new Set(stored.map((s) => s.id));
      const seeded = SAMPLE_SUBMISSIONS.filter((s) => !seenIds.has(s.id));
      return [...stored, ...seeded];
    } catch {
      return [...SAMPLE_SUBMISSIONS];
    }
  }
  
  function saveDemoSubmissions(list) {
    // Persist only the user-generated ones (not the seeded samples).
    const sampleIds = new Set(SAMPLE_SUBMISSIONS.map((s) => s.id));
    const userOnly = list.filter((s) => !sampleIds.has(s.id));
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(userOnly));
  }
  
  // ---------- public API ----------
  
  /**
   * Get a single student's submissions (their own reflections).
   */
  export async function getSubmissionsForStudent(studentId) {
    if (!studentId) return [];
  
    if (firebaseEnabled && db) {
      const q = query(
        collection(db, 'submissions'),
        where('studentId', '==', studentId)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data(), createdAt: toIso(d.data().createdAt) }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
  
    return loadDemoSubmissions()
      .filter((s) => s.studentId === studentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  
  /**
   * Find an existing submission for (cycle, subject) by this student, if any.
   * Used to enforce one-submission-per-subject-per-cycle.
   */
  export async function findExistingSubmission({ studentId, cycleId, subject }) {
    const all = await getSubmissionsForStudent(studentId);
    return all.find((s) => s.cycleId === cycleId && s.subject === subject) || null;
  }
  
  /**
   * Create a new submission. Returns the saved submission with its id.
   */
  export async function createSubmission(payload) {
    // Strip undefined fields just in case.
    const data = {
      cycleId: payload.cycleId,
      studentId: payload.studentId,
      grade: payload.grade || '',
      subject: payload.subject,
      teacherId: payload.teacherId || '',
      responses: payload.responses || {},
      commentResponses: payload.commentResponses || {},
      moderationStatus: payload.moderationStatus || 'clean',
    };
  
    if (firebaseEnabled && db) {
      const ref = await addDoc(collection(db, 'submissions'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return { id: ref.id, ...data, createdAt: new Date().toISOString() };
    }
  
    // Demo mode
    const newSub = {
      ...data,
      id: `demo_sub_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const all = loadDemoSubmissions();
    saveDemoSubmissions([...all, newSub]);
    return newSub;
  }
  
  // ---------- internal ----------
  function toIso(value) {
    if (!value) return new Date().toISOString();
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return new Date().toISOString();
  }