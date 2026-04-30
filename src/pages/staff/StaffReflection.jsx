import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  NotebookPen,
  Save,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MOCK_TEACHER_SUMMARIES, FEEDBACK_CYCLES } from '../../data/mockData.js';
import {
  getSubmissionsForClass,
  getTeacherReflection,
  saveTeacherReflection,
} from '../../utils/storage.js';
import { buildClassSummary, suggestActionableShifts, computeLikertAverages } from '../../utils/aggregation.js';

export default function StaffReflection() {
  const { user } = useAuth();
  const { classId: paramClassId } = useParams();
  const navigate = useNavigate();

  const teacherSummary = user ? MOCK_TEACHER_SUMMARIES[user.uid] : null;
  const teacherClasses =
    user?.classes ||
    teacherSummary?.classes?.map((c) => ({
      id: c.classId,
      name: c.name,
      grade: c.grade,
      subject: teacherSummary.subject,
    })) ||
    [];

  // Default to the URL param, fall back to the first class.
  const initialClassId = paramClassId || teacherClasses[0]?.id || '';
  const [classId, setClassId] = useState(initialClassId);

  // Ensure URL stays consistent if user switches class via dropdown
  useEffect(() => {
    if (classId && classId !== paramClassId) {
      navigate(`/staff/reflection/${classId}`, { replace: true });
    }
  }, [classId, paramClassId, navigate]);

  const classMeta = teacherClasses.find((c) => c.id === classId);
  const seededSummary = teacherSummary?.classes?.find((c) => c.classId === classId);
  const openCycle = useMemo(
    () => FEEDBACK_CYCLES.find((c) => c.status === 'open'),
    []
  );

  const [shifts, setShifts] = useState([]);
  const [chosenAction, setChosenAction] = useState('');
  const [customAction, setCustomAction] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  // Compute suggested shifts (live where possible, seeded otherwise) and load any existing reflection.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!classMeta || !openCycle || !user?.uid) return;
      setLoaded(false);
      setError(null);
      try {
        // Suggested shifts
        const subs = await getSubmissionsForClass({
          cycleId: openCycle.id,
          subject: classMeta.subject,
          grade: classMeta.grade,
        });
        let suggestion;
        if (subs.length >= 5) {
          suggestion = suggestActionableShifts(computeLikertAverages(subs));
        } else if (seededSummary?.actionableShifts?.length) {
          suggestion = seededSummary.actionableShifts;
        } else {
          suggestion = suggestActionableShifts([]);
        }
        if (cancelled) return;
        setShifts(suggestion);

        // Existing reflection (if any)
        const existing = await getTeacherReflection({
          teacherId: user.uid,
          cycleId: openCycle.id,
          classId,
        });
        if (cancelled) return;
        if (existing) {
          // Was the saved action one of today's suggestions, or was it custom?
          if (existing.chosenAction && !suggestion.includes(existing.chosenAction)) {
            setChosenAction('__custom');
            setCustomAction(existing.chosenAction);
          } else {
            setChosenAction(existing.chosenAction || '');
            setCustomAction('');
          }
          setReflectionText(existing.reflectionText || '');
          setSavedAt(existing.createdAt);
        } else {
          setChosenAction('');
          setCustomAction('');
          setReflectionText('');
          setSavedAt(null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Could not load this reflection.');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, classMeta, openCycle, classId, seededSummary]);

  const finalAction =
    chosenAction === '__custom' ? customAction.trim() : chosenAction;

  const canSave =
    Boolean(classMeta) &&
    Boolean(openCycle) &&
    (finalAction.length > 0 || reflectionText.trim().length > 0);

  const handleSave = async () => {
    if (!canSave || !user?.uid) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveTeacherReflection({
        teacherId: user.uid,
        cycleId: openCycle.id,
        classId,
        subject: classMeta.subject,
        summaryViewed: true,
        chosenAction: finalAction,
        reflectionText: reflectionText.trim(),
      });
      setSavedAt(saved.createdAt);
    } catch (e) {
      console.error(e);
      setError('Could not save your reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  if (teacherClasses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card title="No classes yet">
          <p className="text-stone-500">
            Once your classes are linked to your account you'll be able to write
            reflections here. For the demo, sign in as Ms Khumalo, Mrs Pillay, or
            Mr van der Merwe.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <Link
          to="/staff/dashboard"
          className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Teacher reflection</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          A private space to reflect, and pick one shift
        </h1>
        <p className="text-stone-500 mt-1">
          Visible only to you. Your reflection is not shared with management or
          students. It exists to help you grow.
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

      {/* Class chooser */}
      <Card>
        <label htmlFor="class" className="block text-sm font-medium text-navy-900 mb-1.5">
          Reflecting on which class?
        </label>
        <select
          id="class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="input-field"
        >
          {teacherClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {classMeta && (
          <p className="text-sm text-stone-500 mt-2">
            {classMeta.subject} · Grade {classMeta.grade} ·{' '}
            {openCycle?.title || 'Current cycle'}
          </p>
        )}
      </Card>

      {/* Action picker */}
      <Card title="One shift I'll try before the next cycle" icon={Lightbulb}>
        {!loaded ? (
          <p className="text-stone-400">Loading suggestions…</p>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-3">
              Pick one. You can edit it or write your own. Small and doable beats big and brittle.
            </p>
            <div role="radiogroup" aria-label="Choose one action" className="space-y-2">
              {shifts.map((s) => {
                const checked = chosenAction === s;
                return (
                  <label
                    key={s}
                    className={`block cursor-pointer rounded-lg border p-3 transition-colors
                      ${
                        checked
                          ? 'bg-navy-50 border-navy-400'
                          : 'bg-white border-stone-200 hover:border-navy-400 hover:bg-stone-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="action"
                      value={s}
                      checked={checked}
                      onChange={() => setChosenAction(s)}
                      className="sr-only"
                    />
                    <span className="flex items-start gap-2">
                      <span
                        className={`mt-1 inline-block w-3 h-3 rounded-full border ${
                          checked ? 'bg-navy-800 border-navy-800' : 'border-stone-300'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-navy-800">{s}</span>
                    </span>
                  </label>
                );
              })}

              <label
                className={`block cursor-pointer rounded-lg border p-3 transition-colors
                  ${
                    chosenAction === '__custom'
                      ? 'bg-navy-50 border-navy-400'
                      : 'bg-white border-stone-200 hover:border-navy-400 hover:bg-stone-50'
                  }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="__custom"
                  checked={chosenAction === '__custom'}
                  onChange={() => setChosenAction('__custom')}
                  className="sr-only"
                />
                <span className="flex items-start gap-2">
                  <span
                    className={`mt-1 inline-block w-3 h-3 rounded-full border ${
                      chosenAction === '__custom'
                        ? 'bg-navy-800 border-navy-800'
                        : 'border-stone-300'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    <span className="block text-navy-800 mb-1">Write my own</span>
                    <input
                      type="text"
                      value={customAction}
                      onChange={(e) => {
                        setCustomAction(e.target.value);
                        setChosenAction('__custom');
                      }}
                      placeholder="e.g. End each lesson with a 30-second 'one thing I learned' from a different student."
                      className="input-field"
                    />
                  </span>
                </span>
              </label>
            </div>
          </>
        )}
      </Card>

      {/* Reflection text */}
      <Card title="My reflection (private)" icon={NotebookPen}>
        <label htmlFor="reflection" className="sr-only">
          Reflection text
        </label>
        <textarea
          id="reflection"
          rows={6}
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="What stood out for me? What surprised me? What do I want to try?"
          className="input-field resize-y"
          maxLength={2000}
        />
        <p className="mt-1 text-xs text-stone-400">
          Only you can see this. {2000 - reflectionText.length} characters left.
        </p>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-stone-500">
          {savedAt ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold-600" aria-hidden="true" />
              Last saved {new Date(savedAt).toLocaleString()}
            </span>
          ) : (
            'Not saved yet.'
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/staff/summary/${classId}`}
            className="btn-secondary"
          >
            View class summary
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Button variant="primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Saving…' : (
              <>
                <Save className="w-4 h-4" />
                Save reflection
              </>
            )}
          </Button>
        </div>
      </div>

      <Card title="Privacy" icon={ShieldCheck}>
        <p className="text-navy-800 text-sm">
          Your reflection text and chosen action are stored against your account
          for this cycle and class only. Management views aggregated trends; they
          do not see what you write here.
        </p>
      </Card>
    </div>
  );
}