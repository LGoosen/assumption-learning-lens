// Pure helpers that turn a list of submissions into the shapes the
// staff and management dashboards need.
//
// These run client-side in V1. In a production build with Cloud Functions,
// the same logic would run server-side and return pre-aggregated documents
// so individual submissions never have to leave the secure boundary.
//
// All functions are intentionally tolerant: they don't require any specific
// question IDs (so Phase 4's question editor can change them freely),
// and they handle small samples gracefully.

import {
    QUESTIONS_OLDER,
    QUESTIONS_YOUNGER,
  } from './constants.js';
  
  const SMALL_SAMPLE_THRESHOLD = 10;
  
  // Decide which question set a submission used, by inspecting its response keys.
  // Newer submissions (Phase 4+) will carry a `questionSetSnapshot` field and we
  // prefer that when available.
  export function detectQuestionSet(submission) {
    if (submission?.questionSetSnapshot?.likert?.length) {
      return submission.questionSetSnapshot;
    }
    const youngerIds = QUESTIONS_YOUNGER.likert.map((q) => q.id);
    const responseKeys = Object.keys(submission?.responses || {});
    if (responseKeys.some((k) => youngerIds.includes(k))) return QUESTIONS_YOUNGER;
    return QUESTIONS_OLDER;
  }
  
  // Average each Likert question across submissions. Returns:
  // [{ id, text, average, count }]
  export function computeLikertAverages(submissions) {
    if (!submissions?.length) return [];
  
    // Build a map: questionId -> { text, total, count }
    const map = new Map();
  
    for (const sub of submissions) {
      const set = detectQuestionSet(sub);
      for (const q of set.likert) {
        const value = sub.responses?.[q.id];
        if (typeof value !== 'number') continue;
        const entry = map.get(q.id) || { id: q.id, text: q.text, total: 0, count: 0 };
        entry.total += value;
        entry.count += 1;
        map.set(q.id, entry);
      }
    }
  
    return Array.from(map.values())
      .map((e) => ({
        id: e.id,
        text: e.text,
        average: e.count ? Number((e.total / e.count).toFixed(2)) : null,
        count: e.count,
      }))
      .filter((e) => e.average !== null);
  }
  
  // A naive theme extractor for V1: it counts how often certain learning-focused
  // keywords appear in comments, and groups them as "strengths" or "growth areas".
  // This is a placeholder for a Cloud Functions AI call later.
  //
  // TODO (future): Replace with secure server-side AI summarisation that uses
  // AI_SUMMARY_SYSTEM_PROMPT. Until then this gives staff a fair, neutral
  // picture without ever exposing individual comments.
  const STRENGTH_HINTS = [
    'helps', 'helpful', 'understand', 'clear', 'safe', 'enjoy', 'enjoyed',
    'engaging', 'examples', 'recap', 'practice', 'feedback', 'modelling', 'model',
    'annotation', 'discussion', 'support', 'supportive', 'patient',
  ];
  
  const GROWTH_HINTS = [
    'fast', 'pace', 'unsure', 'confused', 'lost', 'difficult', 'struggle',
    'unclear', 'goal', 'goals', 'stuck', 'rushed', 'too much', 'less time',
    'more time', 'recap',
  ];
  
  export function extractCommentThemes(submissions) {
    if (!submissions?.length) return { strengths: [], growth: [] };
  
    const strengthCounts = new Map();
    const growthCounts = new Map();
  
    for (const sub of submissions) {
      const comments = Object.values(sub.commentResponses || {});
      for (const text of comments) {
        if (!text || typeof text !== 'string') continue;
        const lower = text.toLowerCase();
        for (const w of STRENGTH_HINTS) {
          if (lower.includes(w)) strengthCounts.set(w, (strengthCounts.get(w) || 0) + 1);
        }
        for (const w of GROWTH_HINTS) {
          if (lower.includes(w)) growthCounts.set(w, (growthCounts.get(w) || 0) + 1);
        }
      }
    }
  
    const top = (m) =>
      Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([word, n]) => ({ word, count: n }));
  
    return { strengths: top(strengthCounts), growth: top(growthCounts) };
  }
  
  // Suggest three actionable shifts based on which Likert questions scored
  // lowest. The text is intentionally generic and supportive; teachers refine it.
  //
  // TODO (future): Replace with AI-generated, school-specific shifts via Cloud Functions.
  const SHIFT_LIBRARY = {
    // Younger
    y_q1: 'Open each lesson with the learning goal in plain language on the board.',
    y_q2: 'Add a worked example before independent work this week.',
    y_q3: 'Share a small "what to do when stuck" prompt card.',
    y_q4: 'Reaffirm that asking questions is welcomed — model curiosity yourself.',
    y_q5: 'Celebrate effort and persistence, not just correct answers.',
    // Older
    o_q1: 'Display the lesson goal in plain language at the start.',
    o_q2: 'Adjust pace late in the week with a 3-minute recap.',
    o_q3: 'Give one model answer before the next written task.',
    o_q4: 'Connect this week\'s learning to a real-world or future-goal example.',
    o_q5: 'Run a 2-minute self-review checkpoint before submission.',
  };
  
  const FALLBACK_SHIFTS = [
    'Clarify the learning goal at the start of each lesson.',
    'Add one pause point where students check their understanding.',
    'Give one example of what a strong answer looks like before independent work.',
  ];
  
  export function suggestActionableShifts(likertAverages) {
    if (!likertAverages?.length) return FALLBACK_SHIFTS.slice(0, 3);
    const sorted = [...likertAverages].sort((a, b) => a.average - b.average);
    const picks = [];
    for (const item of sorted) {
      const shift = SHIFT_LIBRARY[item.id];
      if (shift && !picks.includes(shift)) picks.push(shift);
      if (picks.length === 3) break;
    }
    // Top up with fallback shifts if we couldn't find three.
    for (const fb of FALLBACK_SHIFTS) {
      if (picks.length === 3) break;
      if (!picks.includes(fb)) picks.push(fb);
    }
    return picks;
  }
  
  // One-shot: given submissions for a class, return everything the
  // StaffClassSummary page needs.
  export function buildClassSummary({
    classMeta,
    submissions,
    expectedTotal,
  }) {
    const responded = submissions?.length || 0;
    const total = expectedTotal || classMeta?.participation?.total || responded;
    const isSmallSample = responded < SMALL_SAMPLE_THRESHOLD;
  
    const likertAverages = computeLikertAverages(submissions);
    const themes = extractCommentThemes(submissions);
    const shifts = suggestActionableShifts(likertAverages);
  
    return {
      classId: classMeta.id,
      name: classMeta.name,
      subject: classMeta.subject,
      grade: classMeta.grade,
      participation: { responded, total },
      likertAverages,
      themes,
      actionableShifts: shifts,
      sampleSize: responded,
      cautionNote: isSmallSample
        ? `Sample size is small (${responded} ${responded === 1 ? 'response' : 'responses'}). Treat patterns as tentative and use them to start a conversation, not draw a conclusion.`
        : null,
    };
  }