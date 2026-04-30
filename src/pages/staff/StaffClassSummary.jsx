import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Users,
  TriangleAlert,
  ShieldCheck,
  NotebookPen,
  Bot,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import SummaryCard from '../../components/SummaryCard.jsx';
import LikertAverageChart from '../../components/LikertAverageChart.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MOCK_TEACHER_SUMMARIES, FEEDBACK_CYCLES } from '../../data/mockData.js';
import { getSubmissionsForClass } from '../../utils/storage.js';
import { buildClassSummary } from '../../utils/aggregation.js';

const SMALL_SAMPLE_THRESHOLD = 10;

export default function StaffClassSummary() {
  const { user } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();

  const teacherSummary = user ? MOCK_TEACHER_SUMMARIES[user.uid] : null;

  // Find the class metadata in two places:
  // (1) the seeded mock summary, (2) the user's profile (if present).
  const classMeta = useMemo(() => {
    const fromUser = user?.classes?.find((c) => c.id === classId);
    const fromMock = teacherSummary?.classes?.find((c) => c.classId === classId);
    if (fromUser) return fromUser;
    if (fromMock) {
      return {
        id: fromMock.classId,
        name: fromMock.name,
        grade: fromMock.grade,
        subject: fromMock.subject,
      };
    }
    return null;
  }, [user, teacherSummary, classId]);

  const seededSummary = teacherSummary?.classes?.find((c) => c.classId === classId);

  const openCycle = useMemo(
    () => FEEDBACK_CYCLES.find((c) => c.status === 'open'),
    []
  );

  const [liveSummary, setLiveSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!classMeta || !openCycle) return;
      try {
        const subs = await getSubmissionsForClass({
          cycleId: openCycle.id,
          subject: classMeta.subject,
          grade: classMeta.grade,
        });
        const summary = buildClassSummary({
          classMeta,
          submissions: subs,
          expectedTotal:
            seededSummary?.participation?.total || subs.length,
        });
        if (!cancelled) setLiveSummary(summary);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Could not load the class summary.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [classMeta, openCycle, seededSummary]);

  if (!user) return null;

  if (!classMeta) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card title="Class not found">
          <p className="text-stone-500">
            We couldn't find a class with that identifier for your account.
          </p>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="btn-secondary mt-4"
          >
            Back to dashboard
          </button>
        </Card>
      </div>
    );
  }

  // Decide what to show.
  // - If we have a live summary AND it has enough responses, use it.
  // - Otherwise, fall back to the seeded mock summary (which has rich strengths/growth strings)
  //   so the dashboards still demonstrate the intended experience.
  const useLive =
    liveSummary && liveSummary.sampleSize >= SMALL_SAMPLE_THRESHOLD;

  const display = useLive
    ? liveSummary
    : seededSummary
    ? {
        classId: seededSummary.classId,
        name: seededSummary.name,
        subject: teacherSummary?.subject,
        grade: seededSummary.grade,
        participation: seededSummary.participation,
        likertAverages: toAverageList(seededSummary, teacherSummary),
        strengths: seededSummary.strengths,
        growthAreas: seededSummary.growthAreas,
        responsibility: seededSummary.responsibility,
        actionableShifts: seededSummary.actionableShifts,
        sampleSize: seededSummary.sampleSize,
        cautionNote: seededSummary.cautionNote,
      }
    : liveSummary; // tiny live data, but still better than nothing

  return (
    <div className="space-y-6">
      <header>
        <Link
          to="/staff/dashboard"
          className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">
          {openCycle?.title || 'Current cycle'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          {classMeta.name}
        </h1>
        <p className="text-stone-500 mt-1">
          {classMeta.subject} · Grade {classMeta.grade}
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

      {!display ? (
        <Card>
          <p className="text-stone-500">Loading…</p>
        </Card>
      ) : (
        <>
          {/* Top-row metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Responses" subtitle="In this cycle" icon={Users}>
              <p className="text-2xl font-semibold text-navy-900">
                {display.participation.responded}
                <span className="text-base font-normal text-stone-400">
                  {' '}
                  / {display.participation.total}
                </span>
              </p>
            </Card>
            <Card title="Average score" subtitle="Across all questions">
              <p className="text-2xl font-semibold text-navy-900">
                {avgOfAverages(display.likertAverages).toFixed(1)}
                <span className="text-base font-normal text-stone-400"> / 5</span>
              </p>
            </Card>
            <Card title="Source" subtitle={useLive ? 'Live' : 'Sample data'}>
              <p className="text-sm text-stone-500">
                {useLive
                  ? 'Computed from this cycle\'s submissions.'
                  : 'Demonstration data while live submissions are still coming in.'}
              </p>
            </Card>
          </div>

          {/* Caution banner for small samples */}
          {display.cautionNote && (
            <div
              role="status"
              className="rounded-lg border border-gold-300 bg-gold-300/15 px-4 py-3 text-navy-900 text-sm flex items-start gap-2"
            >
              <TriangleAlert
                className="w-4 h-4 mt-0.5 text-gold-600 shrink-0"
                aria-hidden="true"
              />
              <span>{display.cautionNote}</span>
            </div>
          )}

          {/* AI summary placeholder card — always shown, with explicit "draft for review" framing. */}
          <Card title="Draft summary (for human review)" icon={Bot}>
            <p className="text-stone-700">
              Below is a draft summary of strengths and growth areas, generated
              from aggregated patterns. <strong>It is a starting point for your reflection,
              not a verdict.</strong> Please read it with professional judgement.
              In a future version, this will be regenerated by a secure
              server-side AI summariser, then reviewed before publication.
            </p>
            <p className="mt-2 text-xs text-stone-400">
              {/* TODO (future): Replace with output from Cloud Function using AI_SUMMARY_SYSTEM_PROMPT. */}
              No individual student or comment is identified.
            </p>
          </Card>

          {/* Likert chart */}
          <Card title="What students said on the scale (1–5)" icon={TrendingUp}>
            <LikertAverageChart data={display.likertAverages} />
          </Card>

          {/* Themes */}
          <div className="grid md:grid-cols-2 gap-4">
            <SummaryCard
              title="Strengths students are noticing"
              icon={Sparkles}
              items={display.strengths || []}
              emptyText="No clear strengths surfaced from comments yet."
              bulletColor="gold"
            />
            <SummaryCard
              title="Areas students are finding difficult"
              icon={TriangleAlert}
              items={display.growthAreas || []}
              emptyText="No clear growth areas surfaced from comments yet."
              bulletColor="navy"
            />
          </div>

          {/* Responsibility note */}
          {display.responsibility && (
            <Card title="Student learning responsibility patterns">
              <p className="text-navy-800">{display.responsibility}</p>
            </Card>
          )}

          {/* Three actionable shifts */}
          <SummaryCard
            title="Three suggested shifts to try"
            subtitle="Small, doable, and reviewed by you before you commit."
            icon={Lightbulb}
            items={display.actionableShifts || []}
            ordered
          />

          {/* Reflect call-to-action */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Link
              to={`/staff/reflection/${classMeta.id}`}
              className="btn-primary"
            >
              <NotebookPen className="w-4 h-4" />
              Open my reflection for this class
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/privacy" className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              How summaries are produced
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ----------- helpers -----------

// Convert seeded summary's likertAverages object to the [{id, text, average, count}] shape
// used by the chart. Falls back gracefully when the seed has no question text.
function toAverageList(seededSummary, teacherSummary) {
  const map = seededSummary?.likertAverages || {};
  const isYounger = String(seededSummary?.grade || '') <= '9';
  // Keys in seed are q1..q5 — match them to younger or older question text.
  const labels = isYounger
    ? [
        'Understanding what to learn',
        'Teacher explanations',
        'What to do when stuck',
        'Safe to ask questions',
        'Effort & persistence',
      ]
    : [
        'Clarity of learning goals',
        'Pace of lessons',
        'Feedback usefulness',
        'Connection to future goals',
        'Ownership of progress',
      ];
  const idsYounger = ['y_q1', 'y_q2', 'y_q3', 'y_q4', 'y_q5'];
  const idsOlder = ['o_q1', 'o_q2', 'o_q3', 'o_q4', 'o_q5'];
  const ids = isYounger ? idsYounger : idsOlder;
  return ['q1', 'q2', 'q3', 'q4', 'q5']
    .map((k, i) =>
      typeof map[k] === 'number'
        ? {
            id: ids[i],
            text: labels[i],
            average: map[k],
            count: seededSummary?.participation?.responded || 0,
          }
        : null
    )
    .filter(Boolean);
}

function avgOfAverages(list) {
  if (!list?.length) return 0;
  const sum = list.reduce((acc, x) => acc + (x.average || 0), 0);
  return sum / list.length;
}