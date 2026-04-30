import { useEffect, useMemo, useState } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { listCycles } from '../../utils/cycles.js';
import { getSubmissionsForCycle } from '../../utils/storage.js';
import {
  computeLikertAverages,
  buildClassSummary,
} from '../../utils/aggregation.js';
import { downloadCsv } from '../../utils/csv.js';
import { MOCK_MANAGEMENT_TRENDS } from '../../data/mockData.js';

export default function ReportsPage() {
  const [cycles, setCycles] = useState([]);
  const [cycleId, setCycleId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const all = await listCycles();
      if (cancelled) return;
      setCycles(all);
      // Default to the most recent open or closed cycle.
      const preferred =
        all.find((c) => c.status === 'open') ||
        all.find((c) => c.status === 'closed') ||
        all[0];
      if (preferred) setCycleId(preferred.id);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cycleId) return;
      setLoading(true);
      try {
        const subs = await getSubmissionsForCycle(cycleId);
        if (!cancelled) setSubmissions(subs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cycleId]);

  const cycle = cycles.find((c) => c.id === cycleId);

  // Build report data, falling back to seeded trends when there's no real data yet.
  const report = useMemo(() => {
    if (!cycle) return null;
    return buildReport({ cycle, submissions });
  }, [cycle, submissions]);

  const handleCsv = () => {
    if (!report) return;
    const rows = [
      ['Assumption Learning Lens — Report'],
      ['Cycle', cycle.title],
      ['Status', cycle.status],
      ['Period', `${cycle.startDate || '—'} to ${cycle.endDate || '—'}`],
      [],
      ['Participation'],
      ['Responses', report.participation.responded],
      ['Expected', report.participation.total],
      ['Rate %', report.participation.percent],
      [],
      ['Question averages (out of 5)'],
      ['Question', 'Average', 'Responses'],
      ...report.likertAverages.map((q) => [q.text, q.average, q.count]),
      [],
      ['Grade trends (avg of question averages)'],
      ['Grade', 'Average'],
      ...report.gradeTrends.map((g) => [g.grade, g.average]),
      [],
      ['Subject trends (avg of question averages)'],
      ['Subject', 'Average'],
      ...report.subjectTrends.map((s) => [s.subject, s.average]),
      [],
      ['Recommended leadership actions'],
      ...report.leadershipActions.map((a) => [a]),
      [],
      ['Notes on limitations'],
      ...report.limitations.map((n) => [n]),
    ];
    downloadCsv(`learning-lens-${cycle.id}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 no-print">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Management</p>
          <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">Reports</h1>
          <p className="text-stone-500 mt-1">
            A respectful, aggregated view by cycle. Patterns first; never rank or expose individuals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="input-field max-w-xs"
            aria-label="Choose cycle"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="primary" onClick={handleCsv}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {loading || !report ? (
        <Card><p className="text-stone-400">Loading…</p></Card>
      ) : (
        <PrintableReport cycle={cycle} report={report} />
      )}

      {/* TODO (future): PDF export via a Cloud Function or library. */}
    </div>
  );
}

function PrintableReport({ cycle, report }) {
  return (
    <article className="space-y-6">
      <Card title="Cycle overview" icon={FileBarChart2}>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Cycle" value={cycle.title} />
          <Stat label="Status" value={cycle.status} />
          <Stat label="Period" value={`${cycle.startDate || '—'} → ${cycle.endDate || '—'}`} />
          <Stat label="Responses" value={`${report.participation.responded} / ${report.participation.total}`} />
          <Stat label="Response rate" value={`${report.participation.percent}%`} />
          <Stat label="Source" value={report.isLive ? 'Live submissions' : 'Sample data'} />
        </dl>
      </Card>

      <Card title="Question averages (out of 5)">
        {report.likertAverages.length === 0 ? (
          <p className="text-stone-500">No question-level averages yet.</p>
        ) : (
          <>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart
                  data={report.likertAverages.map((q, i) => ({
                    short: `Q${i + 1}`,
                    full: q.text,
                    average: q.average,
                  }))}
                  margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece8df" vertical={false} />
                  <XAxis dataKey="short" stroke="#6478a4" fontSize={12} />
                  <YAxis domain={[0, 5]} stroke="#6478a4" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #ece8df' }}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full || ''}
                    formatter={(v) => [`${v} / 5`, 'Average']}
                  />
                  <Bar dataKey="average" fill="#1f2a45" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="average"
                      position="top"
                      formatter={(v) => v.toFixed(1)}
                      style={{ fill: '#171f33', fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ol className="mt-4 space-y-1.5 text-sm">
              {report.likertAverages.map((q, i) => (
                <li key={q.id} className="flex items-start gap-3">
                  <span className="text-stone-400 w-6 shrink-0">Q{i + 1}</span>
                  <span className="flex-1 text-navy-800">{q.text}</span>
                  <span className="text-navy-900 font-semibold tabular-nums">
                    {q.average.toFixed(1)} / 5
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Grade trends">
          <ul className="space-y-1.5 text-sm">
            {report.gradeTrends.map((g) => (
              <li key={g.grade} className="flex justify-between">
                <span className="text-navy-800">Grade {g.grade}</span>
                <span className="font-semibold tabular-nums">{g.average.toFixed(1)} / 5</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Subject trends">
          <ul className="space-y-1.5 text-sm">
            {report.subjectTrends.map((s) => (
              <li key={s.subject} className="flex justify-between">
                <span className="text-navy-800">{s.subject}</span>
                <span className="font-semibold tabular-nums">{s.average.toFixed(1)} / 5</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Positive patterns to celebrate" icon={Sparkles}>
          <ul className="space-y-2 text-navy-800 text-sm">
            {report.positivePatterns.map((p) => <li key={p}>· {p}</li>)}
          </ul>
        </Card>
        <Card title="Risk indicators (cohort-level)" icon={TriangleAlert}>
          <ul className="space-y-2 text-navy-800 text-sm">
            {report.riskIndicators.map((r) => <li key={r}>· {r}</li>)}
          </ul>
        </Card>
      </div>

      <Card title="Recommended leadership actions">
        <ol className="space-y-2 list-decimal list-inside text-navy-800">
          {report.leadershipActions.map((a) => <li key={a}>{a}</li>)}
        </ol>
      </Card>

      <Card title="Notes on limitations" icon={ShieldCheck}>
        <ul className="space-y-2 text-navy-800 text-sm">
          {report.limitations.map((n) => <li key={n}>· {n}</li>)}
        </ul>
      </Card>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
      <dt className="text-xs uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="text-navy-900 font-medium capitalize">{value || '—'}</dd>
    </div>
  );
}

// ----------- report builder -----------
function buildReport({ cycle, submissions }) {
  const responded = submissions.length;
  const total = Math.max(responded, MOCK_MANAGEMENT_TRENDS.participation.total);
  const percent = total > 0 ? Math.round((responded / total) * 100) : 0;
  const isLive = responded > 0;

  // Question-level averages (real if data exists, otherwise none).
  const likertAverages = computeLikertAverages(submissions);

  // Grade trends — average of per-question averages by grade.
  const gradeTrends = isLive
    ? buildGradeTrends(submissions)
    : MOCK_MANAGEMENT_TRENDS.gradeTrends.map((g) => ({
        grade: g.grade,
        average: avg([g.clarity, g.pace, g.feedback, g.future, g.ownership]),
      }));

  // Subject trends.
  const subjectTrends = isLive
    ? buildSubjectTrends(submissions)
    : MOCK_MANAGEMENT_TRENDS.subjectTrends.map((s) => ({
        subject: s.subject,
        average: avg([s.clarity, s.pace, s.feedback]),
      }));

  return {
    isLive,
    participation: { responded, total, percent },
    likertAverages,
    gradeTrends,
    subjectTrends,
    positivePatterns: MOCK_MANAGEMENT_TRENDS.positivePatterns,
    riskIndicators: MOCK_MANAGEMENT_TRENDS.riskIndicators,
    leadershipActions: MOCK_MANAGEMENT_TRENDS.leadershipActions,
    limitations: [
      'Aggregated only. No individual student or staff member is identified.',
      'Sample sizes vary by class; treat small classes with care.',
      'AI summary suggestions are draft only and reviewed by a human.',
      isLive ? 'Live data may still be incoming — final report should be drawn after the cycle closes.' : 'No live submissions for this cycle yet — figures shown are sample data.',
    ],
  };
}

function buildGradeTrends(submissions) {
  const byGrade = groupBy(submissions, 'grade');
  return Object.keys(byGrade)
    .sort()
    .map((grade) => {
      const subs = byGrade[grade];
      const averages = computeLikertAverages(subs).map((q) => q.average);
      return { grade, average: avg(averages) };
    });
}

function buildSubjectTrends(submissions) {
  const bySubject = groupBy(submissions, 'subject');
  return Object.keys(bySubject)
    .sort()
    .map((subject) => {
      const subs = bySubject[subject];
      const averages = computeLikertAverages(subs).map((q) => q.average);
      return { subject, average: avg(averages) };
    });
}

function groupBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item[key] || '—';
    out[k] = out[k] || [];
    out[k].push(item);
  }
  return out;
}

function avg(arr) {
  if (!arr?.length) return 0;
  const clean = arr.filter((n) => typeof n === 'number');
  if (!clean.length) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}