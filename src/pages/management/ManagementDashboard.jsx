import { Link } from 'react-router-dom';
import {
  CalendarRange,
  FileBarChart2,
  Sparkles,
  TriangleAlert,
  ShieldCheck,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import { MOCK_MANAGEMENT_TRENDS, FEEDBACK_CYCLES } from '../../data/mockData.js';

export default function ManagementDashboard() {
  const cycle = FEEDBACK_CYCLES.find((c) => c.id === MOCK_MANAGEMENT_TRENDS.cycleId);
  const { participation, positivePatterns, riskIndicators, leadershipActions } =
    MOCK_MANAGEMENT_TRENDS;
  const participationPct = Math.round(
    (participation.responded / participation.total) * 100
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Whole-school view</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          {cycle?.title || 'Current cycle'}
        </h1>
        <p className="text-stone-500 mt-1">
          A respectful, aggregated view of how learning is being experienced this cycle.
          Patterns first; never rank or expose individuals.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Participation" subtitle="Across all grades">
          <p className="text-2xl font-semibold text-navy-900">
            {participation.responded}
            <span className="text-base font-normal text-stone-400">
              {' '}
              / {participation.total}
            </span>
          </p>
          <p className="text-sm text-stone-500 mt-1">{participationPct}% response rate</p>
        </Card>
        <Card title="Cycle status" subtitle={cycle?.status || 'unknown'}>
          <p className="text-navy-800 capitalize">{cycle?.status}</p>
          <p className="text-sm text-stone-500 mt-1">
            Closes {cycle?.endDate || 'TBC'}
          </p>
        </Card>
        <Card title="Quick links">
          <div className="flex flex-wrap gap-2">
            <Link to="/management/cycles" className="btn-secondary">
              <CalendarRange className="w-4 h-4" /> Cycles
            </Link>
            <Link to="/management/reports" className="btn-primary">
              <FileBarChart2 className="w-4 h-4" /> Reports
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Positive patterns to celebrate" icon={Sparkles}>
          <ul className="space-y-2 text-navy-800">
            {positivePatterns.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Risk indicators (cohort-level only)" icon={TriangleAlert}>
          <ul className="space-y-2 text-navy-800">
            {riskIndicators.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-navy-400 shrink-0" aria-hidden="true" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-400">
            Risk indicators are aggregated patterns, not judgements about specific staff or students.
          </p>
        </Card>
      </div>

      <Card title="Recommended leadership actions">
        <ol className="space-y-2 list-decimal list-inside text-navy-800">
          {leadershipActions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </Card>

      <Card title="Data notes" icon={ShieldCheck}>
        <ul className="space-y-2 text-navy-800 text-sm">
          {MOCK_MANAGEMENT_TRENDS.dataNotes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-400">
          Full charts, grade and subject trends, and exportable reports are built out in the next phase.
        </p>
      </Card>
    </div>
  );
}