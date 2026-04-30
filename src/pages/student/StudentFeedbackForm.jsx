import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Send,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import LikertScale from '../../components/LikertScale.jsx';
import CommentField from '../../components/CommentField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  isYoungerGrade,
  QUESTIONS_OLDER,
  QUESTIONS_YOUNGER,
  SUBJECTS,
  SUBMISSION_REMINDER,
} from '../../utils/constants.js';
import { moderateAllComments } from '../../utils/moderation.js';
import { listCycles } from '../../utils/cycles.js';
import {
  DEFAULT_SET_ID,
  getQuestionSet,
  snapshotForSubmission,
} from '../../utils/questionSets.js';
import {
  createSubmission,
  findExistingSubmission,
} from '../../utils/storage.js';

const STEPS = ['choose', 'questions', 'review'];

export default function StudentFeedbackForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [openCycles, setOpenCycles] = useState([]);
  const [cycleId, setCycleId] = useState('');
  const [subject, setSubject] = useState('');
  const [questionSet, setQuestionSet] = useState(null);

  const [step, setStep] = useState('choose');
  const [responses, setResponses] = useState({});
  const [commentResponses, setCommentResponses] = useState({});
  const [moderationByQuestion, setModerationByQuestion] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateNote, setDuplicateNote] = useState(null);

  // Load open cycles on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const all = await listCycles();
      const open = all.filter((c) => c.status === 'open');
      if (cancelled) return;
      setOpenCycles(open);
      if (open[0]) setCycleId(open[0].id);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cycle = openCycles.find((c) => c.id === cycleId);

  // Whenever the chosen cycle changes, load its question set.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cycle) {
        setQuestionSet(null);
        return;
      }
      const setId = cycle.questionSetId || DEFAULT_SET_ID;
      const set = await getQuestionSet(setId);
      if (cancelled) return;
      setQuestionSet(set);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cycle]);

  const isYounger = isYoungerGrade(user?.grade);
  const questions = useMemo(() => {
    if (questionSet) {
      return {
        likert: isYounger ? questionSet.likertYounger : questionSet.likertOlder,
        comments: isYounger ? questionSet.commentsYounger : questionSet.commentsOlder,
      };
    }
    return isYounger ? QUESTIONS_YOUNGER : QUESTIONS_OLDER;
  }, [questionSet, isYounger]);

  // Duplicate-submission guard
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user?.uid || !cycleId || !subject) {
        setDuplicateNote(null);
        return;
      }
      const existing = await findExistingSubmission({
        studentId: user.uid,
        cycleId,
        subject,
      });
      if (!cancelled) {
        setDuplicateNote(
          existing
            ? `You've already submitted feedback for ${subject} in this cycle. Thank you — only one reflection per subject per cycle is needed.`
            : null
        );
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, cycleId, subject]);

  const subjectsForUser = user?.subjects?.length ? user.subjects : SUBJECTS;
  const allLikertAnswered = (questions.likert || []).every(
    (q) => typeof responses[q.id] === 'number'
  );
  const anyCommentFlagged = Object.values(moderationByQuestion).some(
    (m) => m.status === 'flagged'
  );

  // ---------- handlers ----------
  const handleLikertChange = (id, value) =>
    setResponses((prev) => ({ ...prev, [id]: value }));

  const handleCommentChange = (id, value) =>
    setCommentResponses((prev) => ({ ...prev, [id]: value }));

  const handleModerationChange = (id, result) =>
    setModerationByQuestion((prev) => ({ ...prev, [id]: result }));

  const goNext = () => {
    setError(null);
    if (step === 'choose') {
      if (!cycleId || !subject) {
        setError('Please choose a cycle and a subject before continuing.');
        return;
      }
      if (duplicateNote) {
        setError(duplicateNote);
        return;
      }
      setStep('questions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 'questions') {
      if (!allLikertAnswered) {
        setError('Please answer every scale question before continuing.');
        return;
      }
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'review') setStep('questions');
    else if (step === 'questions') setStep('choose');
    else navigate('/student/dashboard');
  };

  const handleSubmit = async () => {
    setError(null);
    const finalMod = moderateAllComments(commentResponses);
    if (finalMod.overallStatus === 'flagged') {
      setError(
        'One or more comments still need rephrasing before they can be submitted. Please update them and try again.'
      );
      setStep('questions');
      return;
    }

    if (!user?.uid) {
      setError('You need to be signed in to submit. Please sign in and try again.');
      return;
    }

    try {
      setSubmitting(true);
      const snapshot = questionSet
        ? snapshotForSubmission(questionSet, isYounger)
        : null;
      const saved = await createSubmission({
        cycleId,
        studentId: user.uid,
        grade: user.grade || '',
        subject,
        teacherId: '',
        responses,
        commentResponses,
        moderationStatus: 'clean',
        questionSetSnapshot: snapshot,
      });
      navigate('/student/feedback/confirmation', {
        replace: true,
        state: { submissionId: saved.id, subject, cycleTitle: cycle?.title || '' },
      });
    } catch (err) {
      console.error(err);
      setError(
        'Something went wrong while saving your reflection. Please try again. If it keeps happening, let your teacher know.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- render ----------
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'choose' ? 'Back to dashboard' : 'Back'}
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Give feedback</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          {cycle?.title || 'Reflect on your learning'}
        </h1>
        <p className="text-stone-500 mt-1">
          A short, structured reflection. Be honest, kind, specific, and respectful.
        </p>
        <Stepper step={step} />
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-gold-300 bg-gold-300/20 px-4 py-3 text-navy-900 text-sm flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 text-gold-600 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {step === 'choose' && (
        <ChooseStep
          openCycles={openCycles}
          cycleId={cycleId}
          setCycleId={setCycleId}
          subject={subject}
          setSubject={setSubject}
          subjects={subjectsForUser}
          duplicateNote={duplicateNote}
          onContinue={goNext}
        />
      )}

      {step === 'questions' && (
        <QuestionsStep
          questions={questions}
          responses={responses}
          onLikertChange={handleLikertChange}
          commentResponses={commentResponses}
          onCommentChange={handleCommentChange}
          onModerationChange={handleModerationChange}
          allLikertAnswered={allLikertAnswered}
          anyCommentFlagged={anyCommentFlagged}
          onBack={goBack}
          onContinue={goNext}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          cycle={cycle}
          subject={subject}
          questions={questions}
          responses={responses}
          commentResponses={commentResponses}
          submitting={submitting}
          onBack={goBack}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ---------- subcomponents ----------

function Stepper({ step }) {
  const labels = { choose: 'Choose', questions: 'Reflect', review: 'Review' };
  return (
    <ol
      className="mt-5 flex items-center gap-2 text-xs"
      aria-label="Form progress"
    >
      {STEPS.map((s, idx) => {
        const isCurrent = s === step;
        const isComplete = STEPS.indexOf(step) > idx;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold
                ${
                  isCurrent
                    ? 'bg-navy-800 text-white'
                    : isComplete
                    ? 'bg-gold-500 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {idx + 1}
            </span>
            <span className={isCurrent ? 'text-navy-900 font-medium' : 'text-stone-400'}>
              {labels[s]}
            </span>
            {idx < STEPS.length - 1 && (
              <span className="w-6 h-px bg-stone-200" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ChooseStep({
  openCycles,
  cycleId,
  setCycleId,
  subject,
  setSubject,
  subjects,
  duplicateNote,
  onContinue,
}) {
  return (
    <Card>
      {openCycles.length === 0 ? (
        <p className="text-stone-500">
          There is no active reflection cycle right now. Check back soon.
        </p>
      ) : (
        <>
          <div className="mb-5">
            <label htmlFor="cycle" className="block text-sm font-medium text-navy-900 mb-1.5">
              Which cycle are you reflecting on?
            </label>
            <select
              id="cycle"
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="input-field"
            >
              {openCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span id="subject-label" className="block text-sm font-medium text-navy-900 mb-2">
              Which subject would you like to reflect on?
            </span>
            <div
              role="radiogroup"
              aria-labelledby="subject-label"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {subjects.map((s) => {
                const checked = subject === s;
                return (
                  <label
                    key={s}
                    className={`cursor-pointer rounded-lg border text-center px-3 py-2.5 transition-colors
                      ${
                        checked
                          ? 'bg-navy-800 border-navy-800 text-white shadow-soft'
                          : 'bg-white border-stone-200 text-navy-800 hover:border-navy-400 hover:bg-stone-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="subject"
                      value={s}
                      checked={checked}
                      onChange={() => setSubject(s)}
                      className="sr-only"
                    />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>

          {duplicateNote && (
            <p className="mt-4 text-sm text-navy-900 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
              {duplicateNote}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={onContinue}
              disabled={!cycleId || !subject || Boolean(duplicateNote)}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function QuestionsStep({
  questions,
  responses,
  onLikertChange,
  commentResponses,
  onCommentChange,
  onModerationChange,
  allLikertAnswered,
  anyCommentFlagged,
  onBack,
  onContinue,
}) {
  return (
    <>
      <Card title="How is your learning going?" icon={Sparkles}>
        <div className="space-y-7">
          {(questions.likert || []).map((q) => (
            <LikertScale
              key={q.id}
              questionId={q.id}
              questionText={q.text}
              value={responses[q.id]}
              onChange={(v) => onLikertChange(q.id, v)}
            />
          ))}
        </div>
      </Card>

      <Card
        title="A few short comments"
        subtitle="Optional — but very helpful when they're specific and kind."
      >
        <div className="space-y-6">
          {(questions.comments || []).map((q) => (
            <CommentField
              key={q.id}
              questionId={q.id}
              questionText={q.text}
              value={commentResponses[q.id] || ''}
              onChange={(v) => onCommentChange(q.id, v)}
              onModerationChange={onModerationChange}
            />
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={!allLikertAnswered || anyCommentFlagged}
        >
          Review
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {anyCommentFlagged && (
        <p className="text-xs text-gold-600 text-right">
          Please rephrase the highlighted comment(s) before you continue.
        </p>
      )}
    </>
  );
}

function ReviewStep({
  cycle,
  subject,
  questions,
  responses,
  commentResponses,
  submitting,
  onBack,
  onSubmit,
}) {
  return (
    <>
      <Card title="Review and submit" icon={CheckCircle2}>
        <p className="text-stone-500 mb-4">
          Have a quick look. You can go back and change anything before submitting.
        </p>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Field label="Cycle" value={cycle?.title} />
          <Field label="Subject" value={subject} />
        </dl>

        <h3 className="text-sm font-semibold text-navy-900 mt-2 mb-2">Your scale answers</h3>
        <ul className="space-y-2">
          {(questions.likert || []).map((q) => (
            <li key={q.id} className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-navy-50 text-navy-800 text-sm font-semibold shrink-0">
                {responses[q.id] ?? '–'}
              </span>
              <span className="text-navy-800 text-sm">{q.text}</span>
            </li>
          ))}
        </ul>

        <h3 className="text-sm font-semibold text-navy-900 mt-6 mb-2">Your comments</h3>
        <ul className="space-y-3">
          {(questions.comments || []).map((q) => {
            const text = (commentResponses[q.id] || '').trim();
            return (
              <li key={q.id}>
                <p className="text-xs text-stone-400">{q.text}</p>
                <p className="text-navy-800 text-sm">
                  {text || <span className="italic text-stone-400">(no comment)</span>}
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-gold-600 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-navy-900">Before you submit</p>
            <p className="text-sm text-stone-600 mt-1">{SUBMISSION_REMINDER}</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button variant="gold" onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            'Submitting…'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit my reflection
            </>
          )}
        </Button>
      </div>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
      <dt className="text-xs uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="text-navy-900 font-medium">{value || '—'}</dd>
    </div>
  );
}