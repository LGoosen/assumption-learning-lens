// Feedback cycle CRUD.
//
// Production: Firestore collection "feedbackCycles".
// Demo:       localStorage (merged with the seeded FEEDBACK_CYCLES so dashboards
//             remain populated when nothing has been created yet).

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
  import { FEEDBACK_CYCLES } from '../data/mockData.js';
  
  const KEY = 'all_cycles_v1';
  
  function loadDemo() {
    try {
      const raw = localStorage.getItem(KEY);
      const stored = raw ? JSON.parse(raw) : [];
      const seenIds = new Set(stored.map((c) => c.id));
      const seeded = FEEDBACK_CYCLES.filter((c) => !seenIds.has(c.id));
      return [...seeded, ...stored];
    } catch {
      return [...FEEDBACK_CYCLES];
    }
  }
  
  function saveDemo(list) {
    // Persist only user-created cycles, not the seeded ones.
    const seedIds = new Set(FEEDBACK_CYCLES.map((c) => c.id));
    const userOnly = list.filter((c) => !seedIds.has(c.id));
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
  
  export async function listCycles() {
    if (firebaseEnabled && db) {
      const snap = await getDocs(collection(db, 'feedbackCycles'));
      const live = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toIso(d.data().createdAt),
      }));
      // Merge with seeded so dashboards still work in a fresh project.
      const seenIds = new Set(live.map((c) => c.id));
      const seeded = FEEDBACK_CYCLES.filter((c) => !seenIds.has(c.id));
      return [...live, ...seeded].sort(byEndDateDesc);
    }
    return loadDemo().sort(byEndDateDesc);
  }
  
  export async function getCycle(id) {
    if (!id) return null;
    const list = await listCycles();
    return list.find((c) => c.id === id) || null;
  }
  
  export async function createCycle(payload) {
    const data = sanitiseCyclePayload(payload);
  
    if (firebaseEnabled && db) {
      const ref = await addDoc(collection(db, 'feedbackCycles'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return { id: ref.id, ...data, createdAt: new Date().toISOString() };
    }
  
    const newItem = {
      id: `cycle_demo_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const all = loadDemo();
    saveDemo([...all, newItem]);
    return newItem;
  }
  
  export async function updateCycle(id, patch) {
    const data = sanitiseCyclePayload(patch, { partial: true });
  
    if (firebaseEnabled && db) {
      const ref = doc(db, 'feedbackCycles', id);
      await setDoc(ref, data, { merge: true });
      const snap = await getDoc(ref);
      return { id, ...snap.data(), createdAt: toIso(snap.data().createdAt) };
    }
  
    const all = loadDemo();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cycle not found');
    all[idx] = { ...all[idx], ...data };
    saveDemo(all);
    return all[idx];
  }
  
  export async function deleteCycle(id) {
    if (firebaseEnabled && db) {
      await deleteDoc(doc(db, 'feedbackCycles', id));
      return;
    }
    const all = loadDemo();
    saveDemo(all.filter((c) => c.id !== id));
  }
  
  // ---------- helpers ----------
  
  function byEndDateDesc(a, b) {
    return (b.endDate || '').localeCompare(a.endDate || '');
  }
  
  function sanitiseCyclePayload(payload, { partial = false } = {}) {
    const out = {};
    const keys = [
      'title',
      'description',
      'status',
      'startDate',
      'endDate',
      'targetGrades',
      'questionSetId',
      'createdBy',
    ];
    for (const k of keys) {
      if (k in payload) out[k] = payload[k];
    }
    if (!partial) {
      out.title = out.title || 'Untitled cycle';
      out.description = out.description || '';
      out.status = out.status || 'draft';
      out.startDate = out.startDate || '';
      out.endDate = out.endDate || '';
      out.targetGrades = out.targetGrades || [];
      out.questionSetId = out.questionSetId || '';
      out.createdBy = out.createdBy || '';
    }
    return out;
  }
  