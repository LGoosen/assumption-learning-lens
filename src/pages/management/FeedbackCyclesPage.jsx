import { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ALL_GRADES, CYCLE_STATUSES } from '../../utils/constants.js';
import {
  listCycles,
  createCycle,
  updateCycle,
  deleteCycle,
} from '../../utils/cycles.js';
import { listQuestionSets, DEFAULT_SET_ID } from '../../utils/questionSets.js';
import { getSubmissionsForCycle } from '../../utils/storage.js';

const STATUS_LABELS = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
};

const EMPTY_CYCLE = {
  title: '',
  description: '',
  status: 'draft',
  startDate: '',
  endDate: '',
  targetGrades: [...ALL_GRADES],
  questionSetId: DEFAULT_SET_ID,
};

export default function FeedbackCyclesPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [cs, qs] = await Promise.all([listCycles(), listQuestionSets()]);
    setCycles(cs);
    setQuestionSets(qs);
    // Count submissions per cycle for the locked-state UI.
    const counts = {};
    for (const c of cs) {
      try {
        const subs = await getSubmissionsForCycle(c.id);
        counts[c.id] = subs.length;
      } catch {
        counts[c.id] = 0;
      }
    }
    setSubmissionCounts(counts);
  };

  useEffect(() => {
    refresh();
  }, []);

  const sortedCycles = useMemo(
    () =>
      [...cycles].sort(
        (a, b) =>
          (b.startDate || '').localeCompare(a.startDate || '') ||
          (b.title || '').localeCompare(a.title || '')
      ),
    [cycles]
  );

  const beginAdd = () => {
    setError(null);
    setEditingId(null);
    setAdding(true);
    setDraft({ ...EMPTY_CYCLE });
  };

  const beginEdit = (cycle) => {
    setError(null);
    setAdding(false);
    setEditingId(cycle.id);
    setDraft({ ...EMPTY_CYCLE, ...cycle });
  };

  const cancel = () => {
    setEditingId(null);
    setAdding(false);
    setDraft(null);
    setError(null);
  };

  const validate = (d) => {
    if (!d.title.trim()) return 'Please give the cycle a title.';
    if (d.startDate && d.endDate && d.endDate < d.startDate) {
      return 'The end date must be on or after the start date.';
    }
    if (!d.targetGrades?.length) return 'Choose at least one target grade.';
    return null;
  };

  const save = async () => {
    const v = validate(draft);
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = { ...draft, createdBy: user?.uid || '' };
      if (adding) await createCycle(payload);
      else await updateCycle(editingId, payload);
      await refresh();
      cancel();
    } catch (e) {
      console.error(e);
      setError('Could not save the cycle. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const askDelete = (id) => setConfirmingDeleteId(id);
  const confirmDelete = async () => {
    if (!confirmingDeleteId) return;
    setBusy(true);
    try {
      await deleteCycle(confirmingDeleteId);
      setConfirmingDeleteId(null);
      await refresh();
    } catch (e) {
      console.error(e);
      setError('Could not delete the cycle.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Management</p>
          <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
            Feedback Cycles
          </h1>
          <p className="text-stone-500 mt-1">
            Create, open, and close cycles. Closing a cycle stops new submissions but keeps the data intact.
          </p>
        </div>
        {!adding && !editingId && (
          <Button variant="primary" onClick={beginAdd}>
            <Plus className="w-4 h-4" />
            New cycle
          </Button>
        )}
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

      {(adding || editingId) && draft && (
        <CycleEditor
          draft={draft}
          setDraft={setDraft}
          questionSets={questionSets}
          onCancel={cancel}
          onSave={save}
          isAdding={adding}
          busy={busy}
        />
      )}

      <Card title="Cycles" icon={CalendarRange}>
        {sortedCycles.length === 0 ? (
          <p className="text-stone-500">No cycles yet. Create your first one to invite student reflections.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {sortedCycles.map((c) => {
              const count = submissionCounts[c.id] || 0;
              const locked = count > 0;
              const set = questionSets.find((s) => s.id === c.questionSetId);
              return (
                <li
                  key={c.id}
                  className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-navy-900">{c.title}</span>
                      <StatusPill status={c.status} />
                      {locked && (
                        <span
                          className="pill bg-stone-100 text-stone-500"
                          title="Editing is limited because this cycle has submissions."
                        >
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          {count} {count === 1 ? 'submission' : 'submissions'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-stone-500 mt-0.5">
                      {c.startDate || '—'} → {c.endDate || '—'} ·{' '}
                      Grades {c.targetGrades?.join(', ') || '—'} ·{' '}
                      Set: {set?.name || 'School default'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => beginEdit(c)}>
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => askDelete(c.id)}
                      disabled={locked || c.status !== 'draft'}
                      title={
                        locked
                          ? 'Has submissions — close it instead.'
                          : c.status !== 'draft'
                          ? 'Only draft cycles can be deleted.'
                          : 'Delete this draft cycle.'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(confirmingDeleteId)}
        title="Delete this draft cycle?"
        description="This cannot be undone. Only draft cycles with no submissions can be deleted."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setConfirmingDeleteId(null)}
      />
    </div>
  );
}

function CycleEditor({
  draft,
  setDraft,
  questionSets,
  onCancel,
  onSave,
  isAdding,
  busy,
}) {
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const toggleGrade = (g) => {
    const has = draft.targetGrades?.includes(g);
    const next = has
      ? draft.targetGrades.filter((x) => x !== g)
      : [...(draft.targetGrades || []), g];
    next.sort();
    set('targetGrades', next);
  };

  return (
    <Card title={isAdding ? 'New cycle' : 'Edit cycle'} icon={CalendarRange}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Term 2 Midpoint Reflection"
            className="input-field"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="desc">
            Description (shown to students)
          </label>
          <textarea
            id="desc"
            rows={3}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="A short, calming explanation of the cycle's purpose."
            className="input-field resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={draft.status}
            onChange={(e) => set('status', e.target.value)}
            className="input-field"
          >
            {CYCLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-400 mt-1">
            Open = students can submit. Closed = read-only.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="qset">
            Question set
          </label>
          <select
            id="qset"
            value={draft.questionSetId}
            onChange={(e) => set('questionSetId', e.target.value)}
            className="input-field"
          >
            {questionSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.isSeed ? ' (school default)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="start">
            Start date
          </label>
          <input
            id="start"
            type="date"
            value={draft.startDate || ''}
            onChange={(e) => set('startDate', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="end">
            End date
          </label>
          <input
            id="end"
            type="date"
            value={draft.endDate || ''}
            onChange={(e) => set('endDate', e.target.value)}
            className="input-field"
          />
        </div>

        <div className="md:col-span-2">
          <span className="block text-sm font-medium text-navy-900 mb-1.5">Target grades</span>
          <div className="flex flex-wrap gap-2">
            {ALL_GRADES.map((g) => {
              const checked = draft.targetGrades?.includes(g);
              return (
                <label
                  key={g}
                  className={`cursor-pointer rounded-lg border text-center px-3 py-1.5 text-sm transition-colors
                    ${
                      checked
                        ? 'bg-navy-800 border-navy-800 text-white'
                        : 'bg-white border-stone-200 text-navy-800 hover:border-navy-400'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGrade(g)}
                    className="sr-only"
                  />
                  Grade {g}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          <X className="w-4 h-4" />
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : (
            <>
              <Save className="w-4 h-4" />
              {isAdding ? 'Create cycle' : 'Save changes'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function StatusPill({ status }) {
  const map = {
    open: 'bg-gold-300/30 text-gold-600',
    closed: 'bg-stone-100 text-stone-500',
    draft: 'bg-navy-50 text-navy-700',
  };
  return (
    <span className={`pill ${map[status] || ''}`}>
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}