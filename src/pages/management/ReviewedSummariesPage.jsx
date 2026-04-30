import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Save,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { listCycles } from '../../utils/cycles.js';
import { MOCK_TEACHER_SUMMARIES } from '../../data/mockData.js';
import {
  listReviewedSummariesForCycle,
  saveReviewedSummary,
  getReviewedSummary,
} from '../../utils/reviewedSummaries.js';
import { getSubmissionsForClass } from '../../utils/storage.js';
import { computeLikertAverages, buildClassSummary } from '../../utils/aggregation.js';
import { copyToClipboard } from '../../utils/clipboard.js';
import { AI_SUMMARY_SYSTEM_PROMPT } from '../../utils/constants.js';

export default function ReviewedSummariesPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [cycleId, setCycleId] = useState('');
  const [classes, setClasses] = useState([]);
  const [statusByClass, setStatusByClass] = useState({});
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [copyState, setCopyState] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const all = await listCycles();
      if (cancelled) return;
      setCycles(all);
      const target =
        all.find((c) => c.status === 'open') ||
        all.find((c) => c.status === 'closed') ||
        all[0];
      if (target) setCycleId(target.id);
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

      const allClasses = [];
      for (const teacherId of Object.keys(MOCK_TEACHER_SUMMARIES)) {
        const ts = MOCK_TEACHER_SUMMARIES[teacherId];
        for (const c of ts.classes || []) {
          allClasses.push({
            classId: c.classId,
            name: c.name,
            subject: ts.subject,
            grade: c.grade,
            teacherId,
          });
        }
      }

      const reviewed = await listReviewedSummariesForCycle(cycleId);
      const map = {};
      for (const c of allClasses) {
        map[c.classId] = reviewed.find((r) => r.classId === c.classId)
          ? 'reviewed'
          : 'pending';
      }

      if (!cancelled) {
        setClasses(allClasses);
        setStatusByClass(map);
        setSelectedClassId(null);
        setDraft(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cycleId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cycleId || !selectedClassId) {
        setDraft(null);
        return;
      }
      const existing = await getReviewedSummary({
        cycleId,
        classId: selectedClassId,
      });
      const cls = classes.find((c) => c.classId === selectedClassId);
      if (cancelled) return;
      setDraft(
        existing || {
          cycleId,
          classId: selectedClassId,
          subject: cls?.subject || '',
          grade: cls?.grade || '',
          strengths: '',
          growthAreas: '',
          threeShifts: '',
          reviewedConfirmed: false,
        }
      );
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cycleId, selectedClassId, classes]);

  const cycle = cycles.find((c) => c.id === cycleId);
  const selectedClass = classes.find((c) => c.classId === selectedClassId);
  const reviewedCount = Object.values(statusByClass).filter((v) => v === 'reviewed').length;

  const onSet = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.strengths.trim() && !draft.growthAreas.trim() && !draft.threeShifts.trim()) {
      setError('Please paste at least one section before saving.');
      return;
    }
    if (!draft.reviewedConfirmed) {
      setError('Please tick the "I have reviewed this" box before saving.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveReviewedSummary({
        ...draft,
        reviewerUid: user?.uid || '',
        reviewerName: user?.displayName || '',
      });
      setStatusByClass((prev) => ({ ...prev, [selectedClassId]: 'reviewed' }));
    } catch (e) {
      console.error(e);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyForAi = async () => {
    if (!cycle || !selectedClass) return;
    try {
      const subs = await getSubmissionsForClass({
        cycleId: cycle.id,
        subject: selectedClass.subject,
        grade: selectedClass.grade,
      });
      const summary = buildClassSummary({
        classMeta: {
          id: selectedClass.classId,
          name: selectedClass.name,
          subject: selectedClass.subject,
          grade: selectedClass.grade,
        },
        submissions: subs,
        expectedTotal: subs.length,
      });
      const averages = computeLikertAverages(subs);
      const block = formatForAi({ cycle, selectedClass, summary, averages });
      const ok = await copyToClipboard(block);
      setCopyState(ok ? 'ok' : 'err');
      setTimeout(() => setCopyState(null), 3000);
    } catch (e) {
      console.error(e);
      setCopyState('err');
      setTimeout(() => setCopyState(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Management</p>
          <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
            Reviewed Summaries
          </h1>
          <p className="text-stone-500 mt-1">
            Use an external AI tool (NotebookLM or a Gemini Gem) to draft a summary from the
            data, review it carefully, then paste the curated version here. Staff see only what
            you save.
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
          <Link to="/ai-workflow" className="btn-secondary">
            <ShieldCheck className="w-4 h-4" />
            How to do this safely
          </Link>
        </div>
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

      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          title="Classes in this cycle"
          subtitle={`${reviewedCount} of ${classes.length} reviewed`}
          icon={ClipboardCheck}
          className="lg:col-span-1 lg:sticky lg:top-4 self-start"
        >
          {classes.length === 0 ? (
            <p className="text-stone-500 text-sm">No classes found for this cycle yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {classes.map((c) => {
                const status = statusByClass[c.classId];
                const isSelected = selectedClassId === c.classId;
                return (
                  <li key={c.classId}>
                    <button
                      type="button"
                      onClick={() => setSelectedClassId(c.classId)}
                      className={
                        'w-full text-left py-2.5 px-2 rounded-md flex items-center justify-between gap-2 ' +
                        (isSelected ? 'bg-navy-50' : 'hover:bg-stone-50')
                      }
                    >
                      <span className="min-w-0">
                        <span className="block text-navy-900 font-medium truncate">{c.name}</span>
                        <span className="block text-xs text-stone-500">
                          {c.subject} · Grade {c.grade}
                        </span>
                      </span>
                      <span
                        className={
                          'pill shrink-0 ' +
                          (status === 'reviewed'
                            ? 'bg-gold-300/30 text-gold-600'
                            : 'bg-stone-100 text-stone-500')
                        }
                      >
                        {status === 'reviewed' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            Reviewed
                          </>
                        ) : (
                          'Pending'
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!selectedClass ? (
            <Card>
              <p className="text-stone-500">
                Choose a class on the left to start. We'll show you what to copy into your AI
                tool, and where to paste the reviewed result.
              </p>
            </Card>
          ) : (
            <>
              <Card
                title={selectedClass.name}
                subtitle={`${selectedClass.subject} · Grade ${selectedClass.grade}`}
                actions={
                  <Button variant="secondary" onClick={handleCopyForAi}>
                    <Copy className="w-4 h-4" />
                    {copyState === 'ok'
                      ? 'Copied!'
                      : copyState === 'err'
                      ? 'Copy failed'
                      : 'Copy data for AI tool'}
                  </Button>
                }
              >
                <ol className="list-decimal list-inside text-navy-800 text-sm space-y-1">
                  <li>Click <strong>Copy data for AI tool</strong> above.</li>
                  <li>Open your prepared NotebookLM notebook or Gemini Gem.</li>
                  <li>Paste. Read the draft carefully. Edit as needed.</li>
                  <li>Paste the reviewed text into the three boxes below.</li>
                  <li>Tick <em>I have reviewed this</em> and save.</li>
                </ol>
              </Card>

              {draft && (
                <Card title="Reviewed summary" icon={ClipboardCheck}>
                  <Field
                    label="Strengths"
                    placeholder="Patterns of what is helping students learn."
                    value={draft.strengths}
                    onChange={(v) => onSet('strengths', v)}
                  />
                  <Field
                    label="Growth areas"
                    placeholder="Patterns of what students are finding difficult."
                    value={draft.growthAreas}
                    onChange={(v) => onSet('growthAreas', v)}
                  />
                  <Field
                    label="Three small shifts to try"
                    placeholder="Three concrete, doable changes for the next two weeks."
                    value={draft.threeShifts}
                    onChange={(v) => onSet('threeShifts', v)}
                  />

                  <label className="flex items-start gap-2 mt-3 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={draft.reviewedConfirmed}
                      onChange={(e) => onSet('reviewedConfirmed', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-navy-800">
                      I have read this carefully, removed anything that names or
                      blames, and confirmed it focuses on patterns to support growth.
                    </span>
                  </label>

                  <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : (
                        <>
                          <Save className="w-4 h-4" />
                          Save reviewed summary
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              <Card>
                <p className="text-sm text-stone-500">
                  Once saved, this summary appears on the relevant teacher's class summary page,
                  clearly labelled as <em>reviewed by management</em>.
                </p>
                <Link
                  to="/management/reports"
                  className="inline-flex items-center gap-1.5 text-navy-700 hover:text-navy-900 text-sm mt-2"
                >
                  Go to reports
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-navy-900 mb-1.5">{label}</label>
      <textarea
        rows={4}
        className="input-field resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function formatForAi({ cycle, selectedClass, summary, averages }) {
  const lines = [];
  lines.push('You are an instructional coach. Use this prompt and produce a draft summary.');
  lines.push('');
  lines.push('SYSTEM INSTRUCTIONS:');
  lines.push(AI_SUMMARY_SYSTEM_PROMPT);
  lines.push('');
  lines.push('CONTEXT:');
  lines.push('Cycle: ' + cycle.title);
  lines.push('Class: ' + selectedClass.name + ' (' + selectedClass.subject + ', Grade ' + selectedClass.grade + ')');
  lines.push('Sample size: ' + summary.sampleSize);
  if (summary.cautionNote) lines.push('Caution: ' + summary.cautionNote);
  lines.push('');
  lines.push('AGGREGATED LIKERT AVERAGES (out of 5):');
  for (const a of averages) {
    lines.push('- ' + a.text + ': ' + a.average + ' (n=' + a.count + ')');
  }
  lines.push('');
  lines.push('ANONYMISED COMMENT THEMES:');
  if (summary.themes && summary.themes.strengths && summary.themes.strengths.length) {
    lines.push('Strengths keywords:');
    for (const t of summary.themes.strengths) {
      lines.push('- "' + t.word + '" mentioned ' + t.count + ' times');
    }
  }
  if (summary.themes && summary.themes.growth && summary.themes.growth.length) {
    lines.push('Growth keywords:');
    for (const t of summary.themes.growth) {
      lines.push('- "' + t.word + '" mentioned ' + t.count + ' times');
    }
  }
  lines.push('');
  lines.push('OUTPUT FORMAT (use exactly these three sections):');
  lines.push('Strengths:');
  lines.push('- bullet points');
  lines.push('Growth areas:');
  lines.push('- bullet points');
  lines.push('Three small shifts to try:');
  lines.push('1. ...');
  lines.push('2. ...');
  lines.push('3. ...');
  lines.push('');
  lines.push('Do not name any individual student or staff member. Patterns only.');
  return lines.join('\n');
}