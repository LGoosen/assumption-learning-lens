// Question set CRUD.
//
// A "question set" is a versioned collection of younger and older Likert and
// comment questions. Each new student submission stores a snapshot of the set
// at submission time so historical reflections never change retroactively.
//
// Edit safety: a set referenced by a cycle that has submissions is treated
// as LOCKED for editing. To change it, Management clones the set first.

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
  } from 'firebase/firestore';
  import { db, firebaseEnabled } from '../firebase/config.js';
  import {
    QUESTIONS_YOUNGER,
    QUESTIONS_OLDER,
  } from './constants.js';
  
  const KEY = 'all_question_sets_v1';
  
  // The school-default set, always present, never deletable.
  export const DEFAULT_SET_ID = 'set_school_default';
  
  const SEEDED_SETS = [
    {
      id: DEFAULT_SET_ID,
      name: 'School default',
      description: 'The standard set used as the starting point for new cycles.',
      isSeed: true,
      likertYounger: QUESTIONS_YOUNGER.likert,
      commentsYounger: QUESTIONS_YOUNGER.comments,
      likertOlder: QUESTIONS_OLDER.likert,
      commentsOlder: QUESTIONS_OLDER.comments,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];
  
  function loadDemo() {
    try {
      const raw = localStorage.getItem(KEY);
      const stored = raw ? JSON.parse(raw) : [];
      const seenIds = new Set(stored.map((s) => s.id));
      const seeded = SEEDED_SETS.filter((s) => !seenIds.has(s.id));
      return [...seeded, ...stored];
    } catch {
      return [...SEEDED_SETS];
    }
  }
  
  function saveDemo(list) {
    const seedIds = new Set(SEEDED_SETS.map((s) => s.id));
    const userOnly = list.filter((s) => !seedIds.has(s.id));
    localStorage.setItem(KEY, JSON.stringify(userOnly));
  }
  
  function toIso(value) {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
    return value;
  }
  
  // ---------- public API ----------
  
  export async function listQuestionSets() {
    if (firebaseEnabled && db) {
      const snap = await getDocs(collection(db, 'questionSets'));
      const live = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toIso(d.data().createdAt),
      }));
      const seenIds = new Set(live.map((s) => s.id));
      const seeded = SEEDED_SETS.filter((s) => !seenIds.has(s.id));
      return [...seeded, ...live];
    }
    return loadDemo();
  }
  
  export async function getQuestionSet(id) {
    if (!id) return null;
    const list = await listQuestionSets();
    return list.find((s) => s.id === id) || null;
  }
  
  export async function createQuestionSet(payload) {
    const data = normaliseSet(payload, { isNew: true });
    if (firebaseEnabled && db) {
      const ref = await addDoc(collection(db, 'questionSets'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return { id: ref.id, ...data, createdAt: new Date().toISOString() };
    }
    const newSet = {
      id: `set_demo_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const all = loadDemo();
    saveDemo([...all, newSet]);
    return newSet;
  }
  
  export async function updateQuestionSet(id, patch) {
    if (id === DEFAULT_SET_ID) {
      // Allow editing the seeded default but in demo mode it's stored as
      // user data with the same id so it still persists.
    }
    const data = normaliseSet(patch, { isNew: false });
  
    if (firebaseEnabled && db) {
      const ref = doc(db, 'questionSets', id);
      await setDoc(ref, data, { merge: true });
      const snap = await getDoc(ref);
      return { id, ...snap.data(), createdAt: toIso(snap.data().createdAt) };
    }
  
    const all = loadDemo();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Question set not found');
    all[idx] = { ...all[idx], ...data };
    saveDemo(all);
    return all[idx];
  }
  
  export async function deleteQuestionSet(id) {
    if (id === DEFAULT_SET_ID) {
      throw new Error('The default question set cannot be deleted.');
    }
    if (firebaseEnabled && db) {
      await deleteDoc(doc(db, 'questionSets', id));
      return;
    }
    const all = loadDemo();
    saveDemo(all.filter((s) => s.id !== id));
  }
  
  export async function cloneQuestionSet(id, newName) {
    const original = await getQuestionSet(id);
    if (!original) throw new Error('Question set not found');
    const cloned = {
      ...original,
      name: newName || `${original.name} (copy)`,
      isSeed: false,
    };
    delete cloned.id;
    delete cloned.createdAt;
    return createQuestionSet(cloned);
  }
  
  // Snapshot used by submissions.
  export function snapshotForSubmission(set, isYounger) {
    if (!set) return null;
    return {
      setId: set.id,
      setName: set.name,
      likert: isYounger ? set.likertYounger : set.likertOlder,
      comments: isYounger ? set.commentsYounger : set.commentsOlder,
    };
  }
  
  // ---------- helpers ----------
  
  function normaliseSet(payload, { isNew }) {
    const out = {
      name: payload.name || (isNew ? 'New question set' : undefined),
      description: payload.description ?? '',
      likertYounger: cleanQuestions(payload.likertYounger, 'y_q'),
      commentsYounger: cleanQuestions(payload.commentsYounger, 'y_c'),
      likertOlder: cleanQuestions(payload.likertOlder, 'o_q'),
      commentsOlder: cleanQuestions(payload.commentsOlder, 'o_c'),
      isSeed: payload.isSeed === true,
    };
    // Strip undefineds so partial updates don't overwrite with undefined.
    Object.keys(out).forEach((k) => {
      if (out[k] === undefined) delete out[k];
    });
    return out;
  }
  
  function cleanQuestions(list, prefix) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((q) => q && (q.text || '').trim().length > 0)
      .map((q, i) => ({
        id: q.id && /^[a-z0-9_]+$/i.test(q.id) ? q.id : `${prefix}_${Date.now()}_${i}`,
        text: q.text.trim(),
      }));
  }