// Lightweight client-side moderation helper.
// This is NOT final moderation — it is a respectful first pass that asks
// students to rephrase clearly inappropriate, personal, or harmful comments.
// Server-side review and human moderation are still required.

const PROFANITY = [
  'shit',
  'fuck',
  'fucking',
  'bitch',
  'bastard',
  'crap',
  'arse',
  'arsehole',
  'damn',
  'piss',
  'wanker',
  'dickhead',
  'asshole',
  'slut',
  'whore',
];

const INSULT_TERMS = [
  'stupid',
  'idiot',
  'dumb',
  'useless',
  'rubbish',
  'pathetic',
  'lazy',
  'boring',
  'awful',
  'terrible',
  'horrible',
  'worst',
  'hate',
  'sucks',
  'trash',
  'garbage',
  'incompetent',
  'clueless',
];

const PERSONAL_TARGETING = [
  /\bthe\s+teacher\s+is\s+(stupid|useless|terrible|the\s+worst|incompetent|dumb|lazy)\b/i,
  /\b(she|he|they|sir|miss|ma'am|mam|mister|mrs|ms|mr)\s+is\s+(stupid|useless|terrible|incompetent|dumb|lazy|the\s+worst)\b/i,
  /\bi\s+hate\s+(her|him|them|the\s+teacher)\b/i,
];

function containsAny(haystack, list) {
  const lower = haystack.toLowerCase();
  return list.filter((w) =>
    new RegExp(
      `\\b${w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`,
      'i'
    ).test(lower)
  );
}

function isShouting(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 12) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.7;
}

export function moderateComment(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { status: 'clean', reasons: [], suggestion: null };
  }

  const reasons = [];

  const profHits = containsAny(text, PROFANITY);
  if (profHits.length) {
    reasons.push(
      'Contains language that is not appropriate for school feedback.'
    );
  }

  const insultHits = containsAny(text, INSULT_TERMS);
  if (insultHits.length >= 2) {
    reasons.push(
      'Reads as harsh rather than constructive — try focusing on the learning.'
    );
  }

  if (PERSONAL_TARGETING.some((re) => re.test(text))) {
    reasons.push(
      'Sounds like a personal attack — feedback should focus on learning, not the person.'
    );
  }

  if (isShouting(text)) {
    reasons.push(
      'All-capitals can feel like shouting — please use normal sentence case.'
    );
  }

  if (reasons.length === 0) {
    return { status: 'clean', reasons: [], suggestion: null };
  }

  return {
    status: 'flagged',
    reasons,
    suggestion:
      'Try rewriting your comment so it focuses on the learning, is specific, and is respectful. ' +
      'For example: instead of "the lessons are bad", try "I learn better when there are clear examples before we work on our own."',
  };
}

export function moderateAllComments(commentResponses) {
  const results = {};
  let anyFlagged = false;
  for (const [id, text] of Object.entries(commentResponses || {})) {
    const r = moderateComment(text);
    results[id] = r;
    if (r.status === 'flagged') anyFlagged = true;
  }
  return { results, overallStatus: anyFlagged ? 'flagged' : 'clean' };
}
