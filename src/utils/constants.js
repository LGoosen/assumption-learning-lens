// Centralised constants used by forms, dashboards, and reports.

export const ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  MANAGEMENT: 'management',
};

export const ROLE_LABELS = {
  student: 'Student',
  staff: 'Staff',
  management: 'Management',
};

export const LIKERT_OPTIONS = [
  { value: 1, label: 'Not yet' },
  { value: 2, label: 'A little' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Strongly' },
];

export function isYoungerGrade(grade) {
  const n = Number(String(grade).replace(/\D/g, ''));
  if (Number.isNaN(n)) return true;
  return n <= 9;
}

export const QUESTIONS_YOUNGER = {
  likert: [
    { id: 'y_q1', text: 'I understand what I am expected to learn in this subject.' },
    { id: 'y_q2', text: 'The teacher explains things in a way that helps me.' },
    { id: 'y_q3', text: 'I know what to do when I am stuck.' },
    { id: 'y_q4', text: 'I feel safe to ask questions.' },
    { id: 'y_q5', text: 'I try my best in this subject.' },
  ],
  comments: [
    { id: 'y_c1', text: 'One thing that helps me learn in this class is...' },
    { id: 'y_c2', text: 'One thing I could do better as a learner is...' },
    { id: 'y_c3', text: 'One small change that could help our class learn better is...' },
  ],
};

export const QUESTIONS_OLDER = {
  likert: [
    { id: 'o_q1', text: 'The learning goals in this subject are clear to me.' },
    { id: 'o_q2', text: 'The pace of lessons supports my learning.' },
    { id: 'o_q3', text: 'Feedback helps me understand how to improve.' },
    { id: 'o_q4', text: 'I know how this subject connects to my future goals.' },
    { id: 'o_q5', text: 'I take responsibility for my progress in this subject.' },
  ],
  comments: [
    { id: 'o_c1', text: 'One strategy that helps me learn in this subject is...' },
    { id: 'o_c2', text: 'One area where I need to take more responsibility is...' },
    { id: 'o_c3', text: 'One constructive suggestion I have is...' },
  ],
};

export const SUBJECTS = ['Mathematics', 'English', 'Life Sciences', 'History'];

export const ALL_GRADES = ['8', '9', '10', '11', '12'];

export const CYCLE_STATUSES = ['draft', 'open', 'closed'];

export const SUBMISSION_REMINDER =
  'Feedback should help learning improve. Be honest, kind, specific, and respectful.';

// Tone instruction used for future Cloud Functions AI summary generation.
// TODO (future): Move to Cloud Functions config; do not embed any AI keys in front-end code.
export const AI_SUMMARY_SYSTEM_PROMPT = `Summarise the following student feedback for a teacher.
Use a supportive, professional tone. Identify patterns only.
Do not overreact to one comment. Do not rank the teacher.
Provide strengths, possible areas for growth, and three small actionable shifts
the teacher could try in the next two weeks. Include a caution if the sample
size is too small to draw a reliable conclusion.`;