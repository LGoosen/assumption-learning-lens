import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, ArrowLeft, MessageSquareHeart } from 'lucide-react';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSubmissionsForStudent } from '../../utils/storage.js';
import { FEEDBACK_CYCLES, SAMPLE_SUBMISSIONS } from '../../data/mockData.js';
import {
  isYoungerGrade,
  QUESTIONS_OLDER,
  QUESTIONS_YOUNGER,
  LIKERT_OPTIONS,
} from '../../utils/constants.js';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function questionsForSubmission(submission, fallbackGrade) {
  const youngerIds = QUESTIONS_YOUNGER.likert.map((q) => q.id);
  if (Object.keys(submission.responses || {}).some((k) => youngerIds.includes(k))) {
    return QUESTIONS_YOUNGER;
  }
  return isYoungerGrade(fallbackGrade) ? QUESTIONS_YOUNGER : QUESTIONS_OLDER;
}

export default function StudentReflections() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!user?.uid) {
          setItems([]);
          return;
        }
        const list = await getSubmissionsForStudent(user.uid);
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError('Could not load your reflections. Please try again later.');
          setItems([]);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <Link
          to="/student/dashboard"
          className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Your voice, kept honestly</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">My reflections</h1>
        <p className="text-stone-500 mt-1">
          Only you can see these. They are stored privately and used to improve learning.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-gold-300 bg-gold-300/20 px-4 py-3 text-navy-900 text-sm"
        >
          {error}
        </div>
      )}

      {items === null ? (
        <Card>
          <p className="text-stone-400">Loading…</p>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No reflections yet"
            description="When you submit your first reflection, it will appear here."
            icon={NotebookPen}
            action={
              <Link to="/student/feedback" className="btn-primary">
                <MessageSquareHeart className="w-4 h-4" />
                Give feedback
              </Link>
            }
          />
        </Card>
      ) : (
        items.map((sub) => {
          const cycle = FEEDBACK_CYCLES.find((c) => c.id === sub.cycleId);
          const isSeed = SAMPLE_SUBMISSIONS.some((s) => s.id === sub.id);
          const questions = questionsForSubmission(sub, user?.grade);
          return (
            <Card
              key={sub.id}
              title={`${sub.subject} · ${cycle?.title || sub.cycleId}`}
              subtitle={`Submitted ${formatDate(sub.createdAt)}${isSeed ? ' · sample data' : ''}`}
              icon={NotebookPen}
            >
              <div>
                <h3 className="text-sm font-semibold text-navy-900 mb-2">Scale answers</h3>
                <ul className="space-y-2 mb-4">
                  {questions.likert.map((q) => {
                    const value = sub.responses?.[q.id];
                    const opt = LIKERT_OPTIONS.find((o) => o.value === value);
                    return (
                      <li key={q.id} className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-navy-50 text-navy-800 text-sm font-semibold shrink-0">
                          {value ?? '–'}
                        </span>
                        <span className="text-sm text-navy-800">
                          <span className="block">{q.text}</span>
                          {opt && (
                            <span className="block text-xs text-stone-400">{opt.label}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <h3 className="text-sm font-semibold text-navy-900 mb-2">Comments</h3>
                <ul className="space-y-3">
                  {questions.comments.map((q) => {
                    const text = (sub.commentResponses?.[q.id] || '').trim();
                    return (
                      <li key={q.id}>
                        <p className="text-xs text-stone-400">{q.text}</p>
                        <p className="text-navy-800 text-sm">
                          {text || (
                            <span className="italic text-stone-400">(no comment)</span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}