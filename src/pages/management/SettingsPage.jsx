import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  FileBarChart2,
  Sparkles,
  TriangleAlert,
  ShieldCheck,
  ListChecks,
  Settings,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import { listCycles } from '../../utils/cycles.js';
import { getSubmissionsForCycle } from '../../utils/storage.js';
import { MOCK_MANAGEMENT_TRENDS } from '../../data/mockData.js';

export default function ManagementDashboard() {
  const [cycles, setCycles] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [participation, setParticipation] = useState({
    responded: 0,
    total: MOCK_MANAGEMENT_TRENDS.participation.total,
  });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const all = await listCycles();
      if (cancelled) return;
      setCycles(all);
      const open = all.find((c) => c.status === 'open');
      const target = open || all.find((c) => c.id === MOCK_MANAGEMENT_TRENDS.cycleId) || all[0];
      if (!target) return;
      setActiveCycle(target);
      try {
        const subs = await getSubmissionsForCycle(target.id);
        if (cancelled) return;
        if (subs.length > 0) {
          setParticipation({ responded: subs.length, total: Math.max(subs.length, MOCK_MANAGEMENT_TRENDS.participation.total) });
          setIsLive(true);
        } else {
          setParticipation(MOCK_MANAGEMENT_TRENDS.participation);
          setIsLive(false);
        }
      } catch {
        setParticipation(MOCK_MANAGEMENT_TRENDS.participation);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { positivePatterns, riskIndicators, leadershipActions, dataNotes } =
    MOCK_MANAGEMENT_TRENDS;
  const participationPct = participation.total > 0
    ? Math.round((participation.responded / participation.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Whole-school view</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          {activeCycle?.title || 'Current cycle'}
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
          <p className="text-sm text-stone-500 mt-1">
            {participationPct}% response rate {isLive ? '· live' : '· sample'}
          </p>
        </Card>
        <Card title="Cycle status" subtitle={activeCycle?.status || 'unknown'}>
          <p className="text-navy-800 capitalize">{activeCycle?.status}</p>
          <p className="text-sm text-stone-500 mt-1">
            Closes {activeCycle?.endDate || 'TBC'}
          </p>
        </Card>
        <Card title="Quick links">
          <div className="flex flex-wrap gap-2">
            <Link to="/management/cycles" className="btn-secondary">
              <CalendarRange className="w-4 h-4" /> Cycles
            </Link>
            <Link to="/management/questions" className="btn-secondary">
              <ListChecks className="w-4 h-4" /> Questions
            </Link>
            <Link to="/management/reports" className="btn-primary">
              <FileBarChart2 className="w-4 h-4" /> Reports
            </Link>
            <Link to="/management/settings" className="btn-secondary">
              <Settings className="w-4 h-4" /> Settings
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
          {dataNotes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}