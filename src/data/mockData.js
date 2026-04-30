// Sample fictional data for Version 1. Replace with Firestore reads in production.

export const DEMO_USERS = [
  {
    uid: 'demo_student_1',
    displayName: 'Amara Dlamini',
    email: 'amara.demo@assumption.school',
    role: 'student',
    grade: '9',
    subjects: ['Mathematics', 'English', 'Life Sciences', 'History'],
  },
  {
    uid: 'demo_student_2',
    displayName: 'Lebo Naidoo',
    email: 'lebo.demo@assumption.school',
    role: 'student',
    grade: '11',
    subjects: ['Mathematics', 'English', 'Life Sciences', 'History'],
  },
  {
    uid: 'demo_student_3',
    displayName: 'Yusra Patel',
    email: 'yusra.demo@assumption.school',
    role: 'student',
    grade: '12',
    subjects: ['Mathematics', 'English', 'Life Sciences', 'History'],
  },
  {
    uid: 'demo_staff_1',
    displayName: 'Ms Khumalo',
    email: 'n.khumalo.demo@assumption.school',
    role: 'staff',
    grade: '',
    subjects: ['Mathematics'],
    classes: [
      { id: 'class_math_9a', subject: 'Mathematics', grade: '9', name: '9A Maths' },
      { id: 'class_math_11b', subject: 'Mathematics', grade: '11', name: '11B Maths' },
    ],
  },
  {
    uid: 'demo_staff_2',
    displayName: 'Mrs Pillay',
    email: 'r.pillay.demo@assumption.school',
    role: 'staff',
    grade: '',
    subjects: ['English'],
    classes: [
      { id: 'class_eng_9a', subject: 'English', grade: '9', name: '9A English' },
      { id: 'class_eng_12c', subject: 'English', grade: '12', name: '12C English' },
    ],
  },
  {
    uid: 'demo_staff_3',
    displayName: 'Mr van der Merwe',
    email: 's.vdm.demo@assumption.school',
    role: 'staff',
    grade: '',
    subjects: ['History'],
    classes: [
      { id: 'class_hist_11a', subject: 'History', grade: '11', name: '11A History' },
    ],
  },
  {
    uid: 'demo_mgmt_1',
    displayName: 'Mrs Reddy (Deputy Head)',
    email: 'p.reddy.demo@assumption.school',
    role: 'management',
    grade: '',
    subjects: [],
  },
  {
    uid: 'demo_mgmt_2',
    displayName: 'Sister Margaret (Principal)',
    email: 'principal.demo@assumption.school',
    role: 'management',
    grade: '',
    subjects: [],
  },
];

export const FEEDBACK_CYCLES = [
  {
    id: 'cycle_t2_mid_2026',
    title: 'Term 2 Midpoint Reflection',
    description:
      'A short, structured reflection on how learning is going so far this term. Your honest, kind, and specific feedback helps your teachers and the school improve.',
    status: 'open',
    startDate: '2026-04-22',
    endDate: '2026-05-09',
    targetGrades: ['8', '9', '10', '11', '12'],
    createdBy: 'demo_mgmt_1',
    createdAt: '2026-04-20T08:00:00Z',
  },
  {
    id: 'cycle_t1_mid_2026',
    title: 'Term 1 Midpoint Reflection',
    description: 'Closed cycle from earlier in the year.',
    status: 'closed',
    startDate: '2026-02-12',
    endDate: '2026-02-26',
    targetGrades: ['8', '9', '10', '11', '12'],
    createdBy: 'demo_mgmt_1',
    createdAt: '2026-02-10T08:00:00Z',
  },
];

export const SAMPLE_SUBMISSIONS = [
  {
    id: 'sub_001',
    cycleId: 'cycle_t2_mid_2026',
    studentId: 'demo_student_1',
    grade: '9',
    subject: 'Mathematics',
    teacherId: 'demo_staff_1',
    responses: { y_q1: 4, y_q2: 4, y_q3: 3, y_q4: 5, y_q5: 4 },
    commentResponses: {
      y_c1: 'I learn well when Ms Khumalo shows a worked example before we start.',
      y_c2: 'I should ask for help sooner instead of waiting.',
      y_c3: 'Maybe a quick recap at the start of each lesson.',
    },
    moderationStatus: 'clean',
    createdAt: '2026-04-24T10:12:00Z',
  },
  {
    id: 'sub_002',
    cycleId: 'cycle_t2_mid_2026',
    studentId: 'demo_student_2',
    grade: '11',
    subject: 'Mathematics',
    teacherId: 'demo_staff_1',
    responses: { o_q1: 3, o_q2: 3, o_q3: 4, o_q4: 4, o_q5: 4 },
    commentResponses: {
      o_c1: 'Doing the recommended practice questions really helps me.',
      o_c2: 'I need to ask questions when I am unsure rather than just nodding.',
      o_c3: 'Pace can feel fast on Friday lessons.',
    },
    moderationStatus: 'clean',
    createdAt: '2026-04-25T09:45:00Z',
  },
  {
    id: 'sub_003',
    cycleId: 'cycle_t2_mid_2026',
    studentId: 'demo_student_3',
    grade: '12',
    subject: 'English',
    teacherId: 'demo_staff_2',
    responses: { o_q1: 5, o_q2: 4, o_q3: 5, o_q4: 5, o_q5: 4 },
    commentResponses: {
      o_c1: 'Annotating texts together as a class is really useful.',
      o_c2: 'I sometimes leave essay drafts to the last minute.',
      o_c3: 'A model answer for the next essay would help.',
    },
    moderationStatus: 'clean',
    createdAt: '2026-04-25T13:20:00Z',
  },
];

// TODO (future): Replace with live summaries from Cloud Function output.
export const MOCK_TEACHER_SUMMARIES = {
  demo_staff_1: {
    teacherId: 'demo_staff_1',
    cycleId: 'cycle_t2_mid_2026',
    subject: 'Mathematics',
    classes: [
      {
        classId: 'class_math_9a',
        name: '9A Maths',
        grade: '9',
        participation: { responded: 22, total: 26 },
        likertAverages: { q1: 4.1, q2: 3.8, q3: 3.4, q4: 4.5, q5: 4.0 },
        strengths: [
          'Students feel safe asking questions in class.',
          'Most students report trying their best.',
          'Worked examples are appreciated as a learning aid.',
        ],
        growthAreas: [
          'A number of learners are unsure what to do when they get stuck.',
          'Some uncertainty about what is being explained on faster-paced lessons.',
        ],
        responsibility:
          'Most learners recognise effort. Fewer recognise specific self-correction strategies (e.g. checking work, reviewing notes).',
        actionableShifts: [
          'Clarify the learning goal at the start of each lesson with a single sentence on the board.',
          'Add one mid-lesson pause point where students whisper to a partner what they have understood.',
          'Show one example of a strong written answer before independent work each week.',
        ],
        sampleSize: 22,
        cautionNote: null,
      },
      {
        classId: 'class_math_11b',
        name: '11B Maths',
        grade: '11',
        participation: { responded: 18, total: 24 },
        likertAverages: { q1: 3.7, q2: 3.3, q3: 3.9, q4: 4.0, q5: 3.8 },
        strengths: [
          'Feedback on assessments is seen as useful for improvement.',
          'Learners feel the subject connects to future goals.',
        ],
        growthAreas: [
          'Pace of lessons feels fast for several learners, especially late in the week.',
          'Clarity of learning goals could be reinforced.',
        ],
        responsibility:
          'Learners reflect well on responsibility but a few flag time-management.',
        actionableShifts: [
          'Front-load Friday lessons with a 3-minute recap of the week.',
          'Display the learning goal before each new section, in plain language.',
          'Provide a quick "stuck strategies" prompt card on each desk.',
        ],
        sampleSize: 18,
        cautionNote: null,
      },
    ],
  },
  demo_staff_2: {
    teacherId: 'demo_staff_2',
    cycleId: 'cycle_t2_mid_2026',
    subject: 'English',
    classes: [
      {
        classId: 'class_eng_9a',
        name: '9A English',
        grade: '9',
        participation: { responded: 8, total: 26 },
        likertAverages: { q1: 4.2, q2: 4.0, q3: 3.6, q4: 4.3, q5: 4.1 },
        strengths: ['Annotation activities are valued by learners.'],
        growthAreas: ['Some learners want clearer "what to do when stuck" steps.'],
        responsibility: 'Most learners recognise the importance of reading.',
        actionableShifts: [
          'Introduce a one-page "stuck strategies" handout.',
          'Add a model-paragraph share at the start of writing tasks.',
          'Use a visible learning goal at the top of each lesson slide.',
        ],
        sampleSize: 8,
        cautionNote:
          'Sample size is small (under 10 responses). Treat patterns as tentative.',
      },
      {
        classId: 'class_eng_12c',
        name: '12C English',
        grade: '12',
        participation: { responded: 21, total: 24 },
        likertAverages: { q1: 4.6, q2: 4.2, q3: 4.5, q4: 4.7, q5: 4.0 },
        strengths: [
          'Strong sense of purpose in the subject.',
          'Feedback is described as actionable.',
        ],
        growthAreas: [
          'A few learners flag procrastination on essay drafts.',
        ],
        responsibility:
          'Learners take ownership of progress; small minority cite time-management.',
        actionableShifts: [
          'Share a model essay paragraph for the next task.',
          'Introduce a 2-step planning checkpoint between brief and final draft.',
          'Open the lesson with the question the essay must answer.',
        ],
        sampleSize: 21,
        cautionNote: null,
      },
    ],
  },
  demo_staff_3: {
    teacherId: 'demo_staff_3',
    cycleId: 'cycle_t2_mid_2026',
    subject: 'History',
    classes: [
      {
        classId: 'class_hist_11a',
        name: '11A History',
        grade: '11',
        participation: { responded: 17, total: 22 },
        likertAverages: { q1: 4.0, q2: 4.0, q3: 3.8, q4: 3.9, q5: 3.7 },
        strengths: ['Pace feels manageable.', 'Lessons feel coherent.'],
        growthAreas: [
          'Some learners want clearer source-analysis structures.',
        ],
        responsibility: 'A spread — some highly engaged, others passive.',
        actionableShifts: [
          'Introduce a simple PEEL/SCR scaffold at the top of each source task.',
          'Use a 30-second think-pair-share twice per lesson.',
          'Display one essential question per lesson.',
        ],
        sampleSize: 17,
        cautionNote: null,
      },
    ],
  },
};

export const MOCK_MANAGEMENT_TRENDS = {
  cycleId: 'cycle_t2_mid_2026',
  participation: { responded: 312, total: 380 },
  gradeTrends: [
    { grade: '8', clarity: 4.0, pace: 3.9, feedback: 3.8, future: 3.5, ownership: 4.0 },
    { grade: '9', clarity: 3.9, pace: 3.7, feedback: 3.6, future: 3.4, ownership: 4.0 },
    { grade: '10', clarity: 3.8, pace: 3.6, feedback: 3.7, future: 3.7, ownership: 3.8 },
    { grade: '11', clarity: 3.7, pace: 3.4, feedback: 3.8, future: 3.9, ownership: 3.7 },
    { grade: '12', clarity: 4.2, pace: 3.9, feedback: 4.4, future: 4.6, ownership: 4.0 },
  ],
  subjectTrends: [
    { subject: 'Mathematics', clarity: 3.6, pace: 3.3, feedback: 3.7 },
    { subject: 'English', clarity: 4.2, pace: 3.9, feedback: 4.3 },
    { subject: 'Life Sciences', clarity: 3.9, pace: 3.7, feedback: 3.9 },
    { subject: 'History', clarity: 4.0, pace: 4.0, feedback: 3.8 },
  ],
  commonNeeds: [
    'Clearer learning goals at the start of lessons.',
    'More "what to do when stuck" strategies for younger grades.',
    'Pace adjustment requests in mid-week Mathematics lessons.',
  ],
  staffSupport: [
    'Short staff workshop: making the lesson goal visible.',
    'Peer-share session on quick formative checks (whisper-pair, exit slips).',
    'Light-touch coaching on essay/source-analysis scaffolds.',
  ],
  positivePatterns: [
    'Strong sense of safety to ask questions across most subjects.',
    'Grade 12s report high purpose and useful feedback.',
    'Annotation, modelling, and worked examples are widely valued.',
  ],
  riskIndicators: [
    'Grade 11 Mathematics shows pace strain — cohort, not a single class.',
    'Lower clarity scores in Grade 9 may compound by Grade 10 if unaddressed.',
  ],
  leadershipActions: [
    'Run a "first 5 minutes of a lesson" focus across the next cycle.',
    'Coordinate Mathematics department check-in on pacing.',
    'Celebrate Grade 12 patterns publicly to model strong practice.',
    'Treat all summaries as a starting point for conversation, not a verdict.',
  ],
  dataNotes: [
    'Aggregated only. No individual student or staff member is identified.',
    'Sample sizes vary by class; treat small classes with care.',
    'AI-generated summary suggestions are draft only and reviewed by a human.',
  ],
};