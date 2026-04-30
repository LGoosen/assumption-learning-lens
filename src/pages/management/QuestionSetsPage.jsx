import { useEffect, useMemo, useState } from 'react';
import {
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Copy,
  Lock,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  listQuestionSets,
  createQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  cloneQuestionSet,
  DEFAULT_SET_ID,
} from '../../utils/questionSets.js';
import { listCycles } from '../../utils/cycles.js';
import { getSubmissionsForCycle } from '../../utils/storage.js';

const EMPTY_QUESTION = (prefix) => ({ id: '', text: '' });

export default function QuestionSetsPage() {
  const [sets, setSets] = useState([]);
  const [usage, setUsage] = useState({}); // setId -> { cycles: [{title, locked, count}] }
  const [activeId, setActiveId] = useState(DEFAULT_SET_ID);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  const refresh = async () => {
    const [allSets, allCycles] = await Promise.all([listQuestionSets(), listCycles()]);
    setSets(allSets);

    // Compute usage and lock state for each set.
    const map = {};
    for (const s of allSets) {
      const usingCycles = allCycles.filter((c) => (c.questionSetId || DEFAULT_SET_ID) === s.id);
      let lockedCount = 0;
      const cycleSummaries = [];
      for (const c of usingCycles) {
        const subs = await getSubmissionsForCycle(c.id);
        if (subs.length > 0) lockedCount++;
        cycleSummaries.push({ title: c.title, locked: subs.length > 0, count: subs.length });
      }
      map[s.id] = { cycles: cycleSummaries, locked: lockedCount > 0 };
    }
    setUsage(map);

    // If the active set vanished, fall back.
    if (!allSets.find((s) => s.id === activeId)) setActiveId(DEFAULT_SET_ID);
  };

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = useMemo(
    () => sets.find((s) => s.id === activeId) || null,
    [sets, activeId]
  );

  const isLocked = active ? Boolean(usage[active.id]?.locked) : false;

  const beginEdit = () => {
    if (!active) return;
    setDraft({
      ...active,
      likertYounger: [...(active.likertYounger || [])],
      commentsYounger: [...(active.commentsYounger || [])],
      likertOlder: [...(active.likertOlder || [])],
      commentsOlder: [...(active.commentsOlder || [])],
    });
    setError(null);
  };

  const cancel = () => {
    setDraft(null);
    setError(null);
  };

  const validate = (d) => {
    if (!d.name?.trim()) return 'Please give the question set a name.';
    const hasAny =
      d.likertYounger?.some((q) => q.text.trim()) ||
      d.commentsYounger?.some((q) => q.text.trim()) ||
      d.likertOlder?.some((q) => q.text.trim()) ||
      d.commentsOlder?.some((q) => q.text.trim());
    if (!hasAny) return 'Please add at least one question.';
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
      await updateQuestionSet(active.id, draft);
      await refresh();
      setDraft(null);
    } catch (e) {
      console.error(e);
      setError('Could not save changes. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleNew = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createQuestionSet({
        name: 'New question set',
        description: '',
        likertYounger: [{ id: '', text: '' }],
        commentsYounger: [{ id: '', text: '' }],
        likertOlder: [{ id: '', text: '' }],
        commentsOlder: [{ id: '', text: '' }],
      });
      await refresh();
      setActiveId(created.id);
    } finally {
      setBusy(false);
    }
  };

  const handleClone = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const cloned = await cloneQuestionSet(active.id, `${active.name} (copy)`);
      await refresh();
      setActiveId(cloned.id);
    } finally {
      setBusy(false);
    }
  };

  const askDelete = () => setConfirmingDeleteId(active?.id);
  const confirmDelete = async () => {
    if (!confirmingDeleteId) return;
    setBusy(true);
    try {
      await deleteQuestionSet(confirmingDeleteId);
      setConfirmingDeleteId(null);
      await refresh();
      setActiveId(DEFAULT_SET_ID);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Could not delete question set.');
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
            Question Sets
          </h1>
          <p className="text-stone-500 mt-1">
            Different cycles can use different question sets. Past submissions keep the wording they were submitted with.
          </p>
        </div>
        <Button variant="primary" onClick={handleNew} disabled={busy}>
          <Plus className="w-4 h-4" />
          New set
        </Button>
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

      <Card title="Choose a set to edit" icon={ListChecks}>
        <div className="flex flex-wrap gap-2">
          {sets.map((s) => {
            const u = usage[s.id];
            const isActive = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveId(s.id);
                  setDraft(null);
                }}
                className={`rounded-lg px-3 py-2 text-sm border transition-colors text-left max-w-xs
                  ${
                    isActive
                      ? 'bg-navy-800 text-white border-navy-800'
                      : 'bg-white border-stone-200 text-navy-800 hover:border-navy-400'
                  }`}
              >
                <div className="font-medium">{s.name}</div>
                <div className={`text-xs ${isActive ? 'text-ivory-200' : 'text-stone-500'}`}>
                  {u?.cycles?.length
                    ? `Used by ${u.cycles.length} cycle${u.cycles.length === 1 ? '' : 's'}`
                    : 'Not yet used'}
                  {u?.locked ? ' · locked (has submissions)' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {active && (
        <Card
          title={active.name}
          subtitle={active.description || (active.isSeed ? 'School default — clone before redesigning if you want a clean slate.' : '')}
          icon={ListChecks}
          actions={
            !draft ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleClone}>
                  <Copy className="w-4 h-4" />
                  Clone
                </Button>
                <Button variant="primary" onClick={beginEdit} disabled={isLocked}>
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={askDelete}
                  disabled={active.id === DEFAULT_SET_ID || isLocked}
                  title={
                    active.id === DEFAULT_SET_ID
                      ? 'The default set cannot be deleted.'
                      : isLocked
                      ? 'In use by a cycle with submissions — clone instead.'
                      : 'Delete set'
                  }
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            ) : null
          }
        >
          {isLocked && !draft && (
            <div className="mb-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-navy-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-500" aria-hidden="true" />
              This set is in use by a cycle that already has submissions, so it can't be edited directly. Clone it to make changes.
            </div>
          )}

          {!draft ? (
            <ReadOnlyView set={active} />
          ) : (
            <Editor draft={draft} setDraft={setDraft} onCancel={cancel} onSave={save} busy={busy} />
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(confirmingDeleteId)}
        title="Delete this question set?"
        description="It will no longer be available for new cycles. Past submissions are unaffected — they keep the wording they were submitted with."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setConfirmingDeleteId(null)}
      />
    </div>
  );
}

function ReadOnlyView({ set }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Section title="Younger learners (Grades 8–9)">
        <Sub label="Scale questions" items={set.likertYounger} />
        <Sub label="Comment prompts" items={set.commentsYounger} />
      </Section>
      <Section title="Older learners (Grades 10–12)">
        <Sub label="Scale questions" items={set.likertOlder} />
        <Sub label="Comment prompts" items={set.commentsOlder} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-navy-900 mb-2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Sub({ label, items = [] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">{label}</p>
      {items.length === 0 ? (
        <p className="text-stone-400 text-sm italic">None</p>
      ) : (
        <ol className="space-y-1.5 list-decimal list-inside text-sm text-navy-800">
          {items.map((q) => (
            <li key={q.id}>{q.text}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Editor({ draft, setDraft, onCancel, onSave, busy }) {
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="setname">
            Set name
          </label>
          <input
            id="setname"
            type="text"
            className="input-field"
            value={draft.name || ''}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="setdesc">
            Description (internal notes)
          </label>
          <input
            id="setdesc"
            type="text"
            className="input-field"
            value={draft.description || ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-navy-900 mb-2">Younger learners (Grades 8–9)</h3>
          <QuestionList
            label="Scale questions"
            items={draft.likertYounger}
            onChange={(next) => set('likertYounger', next)}
            placeholder="e.g. I understand what I am expected to learn in this subject."
          />
          <QuestionList
            label="Comment prompts"
            items={draft.commentsYounger}
            onChange={(next) => set('commentsYounger', next)}
            placeholder="e.g. One thing that helps me learn in this class is..."
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy-900 mb-2">Older learners (Grades 10–12)</h3>
          <QuestionList
            label="Scale questions"
            items={draft.likertOlder}
            onChange={(next) => set('likertOlder', next)}
            placeholder="e.g. The learning goals in this subject are clear to me."
          />
          <QuestionList
            label="Comment prompts"
            items={draft.commentsOlder}
            onChange={(next) => set('commentsOlder', next)}
            placeholder="e.g. One strategy that helps me learn is..."
          />
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
              Save changes
            </>
          )}
        </Button>
      </div>
    </>
  );
}

function QuestionList({ label, items, onChange, placeholder }) {
  const list = items || [];

  const update = (idx, text) => {
    const next = [...list];
    next[idx] = { ...next[idx], text };
    onChange(next);
  };
  const remove = (idx) => onChange(list.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const next = [...list];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const add = () => onChange([...list, { id: '', text: '' }]);

  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">{label}</p>
      <ul className="space-y-2">
        {list.map((q, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2 text-xs text-stone-400 w-5 shrink-0">{i + 1}</span>
            <input
              type="text"
              value={q.text}
              onChange={(e) => update(i, e.target.value)}
              className="input-field flex-1"
              placeholder={placeholder}
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 text-stone-500 hover:text-navy-900 disabled:opacity-30"
                aria-label="Move up"
                title="Move up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
                className="p-1 text-stone-500 hover:text-navy-900 disabled:opacity-30"
                aria-label="Move down"
                title="Move down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1 text-stone-500 hover:text-gold-600"
              aria-label="Remove question"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-2" onClick={add}>
        <Plus className="w-4 h-4" />
        Add {label.toLowerCase().slice(0, -1)}
      </Button>
    </div>
  );
}