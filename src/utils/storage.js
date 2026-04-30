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
    doc,
    setDoc,
    getDoc,
  } from 'firebase/firestore';
  import { db, firebaseEnabled } from '../firebase/config.js';
  import { SAMPLE_SUBMISSIONS } from '../data/mockData.js';
  
  const SUBMISSIONS_KEY = 'all_submissions_v1';
  const REFLECTIONS_KEY = 'all_teacher_reflections_v1';
  
  // ---------- demo helpers ----------
  function loadDemoSubmissions() {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      if (!raw) return [...SAMPLE_SUBMISSIONS];
      const stored = JSON.parse(raw);
      const seenIds = new Set(stored.map((s) => s.id));
      const seeded = SAMPLE_SUBMISSIONS.filter((s) => !seenIds.has(s.id));
      return [...stored, ...seeded];
    } catch {
      return [...SAMPLE_SUBMISSIONS];
    }
  }
  
  function saveDemoSubmissions(list) {
    const sampleIds = new Set(SAMPLE_SUBMISSIONS.map((s) => s.id));
    const userOnly = list.filter((s) => !sampleIds.has(s.id));
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(userOnly));
  }
  
  function loadDemoReflections() {
    try {
      const raw = localStorage.getItem(REFLECTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  
  function saveDemoReflections(list) {
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(list));
  }
  
  // ---------- submissions API ----------
  
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
   * Submissions for a class within a specific cycle.
   * In V1 we filter by (cycleId, subject, grade) — the closest demo equivalent
   * of "this teacher's class in this cycle" without a class roster table.
   *
   * TODO (future): Once class rosters exist, key this on classId directly.
   */
  export async function getSubmissionsForClass({ cycleId, subject, grade }) {
    if (!cycleId || !subject) return [];
  
    if (firebaseEnabled && db) {
      const q = query(
        collection(db, 'submissions'),
        where('cycleId', '==', cycleId),
        where('subject', '==', subject)
      );
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toIso(d.data().createdAt),
      }));
      return grade ? all.filter((s) => String(s.grade) === String(grade)) : all;
    }
  
    return loadDemoSubmissions().filter(
      (s) =>
        s.cycleId === cycleId &&
        s.subject === subject &&
        (grade ? String(s.grade) === String(grade) : true)
    );
  }
  
  export async function findExistingSubmission({ studentId, cycleId, subject }) {
    const all = await getSubmissionsForStudent(studentId);
    return all.find((s) => s.cycleId === cycleId && s.subject === subject) || null;
  }
  
  export async function createSubmission(payload) {
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
  
    const newSub = {
      ...data,
      id: `demo_sub_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const all = loadDemoSubmissions();
    saveDemoSubmissions([...all, newSub]);
    return newSub;
  }
  
  // ---------- teacher reflections API ----------
  
  function reflectionId({ teacherId, cycleId, classId }) {
    return `${teacherId}__${cycleId}__${classId}`;
  }
  
  export async function getTeacherReflection({ teacherId, cycleId, classId }) {
    if (!teacherId || !cycleId || !classId) return null;
    const id = reflectionId({ teacherId, cycleId, classId });
  
    if (firebaseEnabled && db) {
      const ref = doc(db, 'teacherReflections', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      return { id, ...data, createdAt: toIso(data.createdAt) };
    }
  
    const all = loadDemoReflections();
    return all.find((r) => r.id === id) || null;
  }
  
  export async function saveTeacherReflection({
    teacherId,
    cycleId,
    classId,
    subject,
    summaryViewed,
    chosenAction,
    reflectionText,
  }) {
    const id = reflectionId({ teacherId, cycleId, classId });
    const data = {
      id,
      teacherId,
      cycleId,
      classId,
      subject: subject || '',
      summaryViewed: Boolean(summaryViewed),
      chosenAction: chosenAction || '',
      reflectionText: reflectionText || '',
    };
  
    if (firebaseEnabled && db) {
      const ref = doc(db, 'teacherReflections', id);
      await setDoc(
        ref,
        { ...data, createdAt: serverTimestamp() },
        { merge: true }
      );
      return { ...data, createdAt: new Date().toISOString() };
    }
  
    const all = loadDemoReflections();
    const without = all.filter((r) => r.id !== id);
    const next = { ...data, createdAt: new Date().toISOString() };
    saveDemoReflections([...without, next]);
    return next;
  }
  
  export async function listTeacherReflections({ teacherId }) {
    if (!teacherId) return [];
  
    if (firebaseEnabled && db) {
      const q = query(
        collection(db, 'teacherReflections'),
        where('teacherId', '==', teacherId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toIso(d.data().createdAt),
      }));
    }
  
    return loadDemoReflections().filter((r) => r.teacherId === teacherId);
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