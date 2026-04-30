import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  NotebookPen,
  ShieldCheck,
  AlertCircle,
  TriangleAlert,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  MOCK_TEACHER_SUMMARIES,
  FEEDBACK_CYCLES,
} from '../../data/mockData.js';
import {
  getSubmissionsForClass,
  listTeacherReflections,
} from '../../utils/storage.js';

export default function StaffDashboard() {
  const { user } = useAuth();
  const summary = user ? MOCK_TEACHER_SUMMARIES[user.uid] : null;
  const openCycle = FEEDBACK_CYCLES.find((c) => c.status === 'open');

  // Build a unified class list: prefer the user profile, fall back to seeded mock.
  const classes =
    user?.classes ||
    summary?.classes?.map((c) => ({
      id: c.classId,
      name: c.name,
      grade: c.grade,
      subject: summary.subject,
    })) ||
    [];

  const [liveCounts, setLiveCounts] = useState({}); // { classId: { responded, total, source: 'live'|'seed' } }
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.uid || !openCycle || classes.length === 0) return;

      // Live submission counts per class
      const counts = {};
      for (const c of classes) {
        try {
          const subs = await getSubmissionsForClass({
            cycleId: openCycle.id,
            subject: c.subject,
            grade: c.grade,
          });
          const seeded = summary?.classes?.find((sc) => sc.classId === c.id);
          counts[c.id] = subs.length
            ? {
                responded: subs.length,
                total: seeded?.participation?.total || subs.length,
                source: 'live',
              }
            : seeded
            ? {
                responded: seeded.participation.responded,
                total: seeded.participation.total,
                source: 'seed',
              }
            : { responded: 0, total: 0, source: 'live' };
        } catch (e) {
          console.error(e);
        }
      }
      if (cancelled) return;
      setLiveCounts(counts);

      // Reflections this teacher has saved
      try {
        const list = await listTeacherReflections({ teacherId: user.uid });
        if (!cancelled) setReflections(list);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, openCycle, classes, summary]);

  const totalResponded = Object.values(liveCounts).reduce(
    (acc, c) => acc + (c.responded || 0),
    0
  );
  const totalExpected = Object.values(liveCounts).reduce(
    (acc, c) => acc + (c.total || 0),
    0
  );

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

      {classes.length === 0 ? (
        <Card title="No classes yet" icon={AlertCircle}>
          <p className="text-stone-500">
            Once your classes are linked to your account you'll see them here.
            For the demo, sign in as Ms Khumalo, Mrs Pillay, or Mr van der Merwe.
          </p>
        </Card>
      ) : (
        <Card
          title="Your classes this cycle"
          icon={ClipboardList}
          subtitle="Open a class to see strengths, growth areas, and three suggested shifts."
        >
          <ul className="divide-y divide-stone-100">
            {classes.map((c) => {
              const counts = liveCounts[c.id] || { responded: 0, total: 0, source: 'live' };
              const reflection = reflections.find(
                (r) => r.classId === c.id && r.cycleId === openCycle?.id
              );
              const isSmall = counts.responded > 0 && counts.responded < 10;
              return (
                <li
                  key={c.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="font-medium text-navy-900">{c.name}</div>
                    <div className="text-sm text-stone-500">
                      {counts.responded} of {counts.total} responses
                      {counts.source === 'seed' ? ' · sample' : ''}
                      {isSmall && (
                        <span className="ml-2 inline-flex items-center gap-1 text-gold-600">
                          <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
                          small sample
                        </span>
                      )}
                    </div>
                    {reflection?.chosenAction && (
                      <div className="text-xs text-navy-700 mt-1">
                        Action chosen: <span className="font-medium">{reflection.chosenAction}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/staff/summary/${c.id}`}
                      className="btn-secondary"
                      aria-label={`View summary for ${c.name}`}
                    >
                      View summary
                    </Link>
                    <Link
                      to={`/staff/reflection/${c.id}`}
                      className="btn-primary"
                      aria-label={`Open reflection for ${c.name}`}
                    >
                      Reflect
                    </Link>
                  </div>
                </li>
              );
            })}
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