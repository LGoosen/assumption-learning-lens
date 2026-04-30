import { Link } from 'react-router-dom';
import { ClipboardList, NotebookPen, ShieldCheck, AlertCircle } from 'lucide-react';
import Card from '../../components/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MOCK_TEACHER_SUMMARIES, FEEDBACK_CYCLES } from '../../data/mockData.js';

export default function StaffDashboard() {
  const { user } = useAuth();
  const summary = user ? MOCK_TEACHER_SUMMARIES[user.uid] : null;
  const openCycle = FEEDBACK_CYCLES.find((c) => c.status === 'open');

  const totalResponded =
    summary?.classes.reduce((acc, c) => acc + c.participation.responded, 0) ?? 0;
  const totalExpected =
    summary?.classes.reduce((acc, c) => acc + c.participation.total, 0) ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Staff view</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          Hello {user?.displayName || 'colleague'}
        </h1>
        <p className="text-stone-500 mt-1">
          A calm overview of how learners are experiencing your classes this cycle.
          Treat all summaries as a starting point for conversation, not a verdict.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Current cycle" subtitle={openCycle?.title || '—'}>
          <p className="text-stone-500 text-sm">
            {openCycle ? `Closes ${openCycle.endDate}` : 'No open cycle'}
          </p>
        </Card>
        <Card title="Responses received" subtitle="Across your classes">
          <p className="text-2xl font-semibold text-navy-900">
            {totalResponded}
            <span className="text-base font-normal text-stone-400"> / {totalExpected}</span>
          </p>
        </Card>
        <Card title="Subject" subtitle="Your teaching focus">
          <p className="text-2xl font-semibold text-navy-900">
            {summary?.subject || (user?.subjects?.[0] ?? '—')}
          </p>
        </Card>
      </div>

      {!summary ? (
        <Card title="No summary yet" icon={AlertCircle}>
          <p className="text-stone-500">
            A summary will appear here once enough learners have submitted feedback for this cycle.
          </p>
        </Card>
      ) : (
        <Card
          title="Your classes this cycle"
          icon={ClipboardList}
          subtitle="Open a class to see strengths, growth areas, and three suggested shifts."
        >
          <ul className="divide-y divide-stone-100">
            {summary.classes.map((c) => (
              <li
                key={c.classId}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="font-medium text-navy-900">{c.name}</div>
                  <div className="text-sm text-stone-500">
                    {c.participation.responded} of {c.participation.total} responses
                    {c.cautionNote ? ' · small sample, treat tentatively' : ''}
                  </div>
                </div>
                <Link
                  to={`/staff/summary/${c.classId}`}
                  className="btn-secondary"
                  aria-label={`View summary for ${c.name}`}
                >
                  View summary
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Reflection space" icon={NotebookPen}>
          <p className="text-stone-500 text-sm mb-4">
            Add a private teacher reflection and pick one shift to try before the next cycle.
          </p>
          <Link to="/staff/reflection" className="btn-primary">
            Open reflection
          </Link>
        </Card>
        <Card title="Privacy" icon={ShieldCheck}>
          <p className="text-stone-500 text-sm mb-4">
            How summaries are produced, and what learners are told before they submit.
          </p>
          <Link to="/privacy" className="btn-secondary">
            Read privacy notice
          </Link>
        </Card>
      </div>
    </div>
  );
}