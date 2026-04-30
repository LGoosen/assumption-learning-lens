import { CheckCircle2, ShieldCheck } from 'lucide-react';
import Card from './Card.jsx';

export default function ReviewedSummaryView({ summary }) {
  if (!summary) return null;
  const reviewedDate = summary.reviewedAt
    ? new Date(summary.reviewedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <Card
      title="Reviewed summary (from management)"
      subtitle={`Reviewed by ${summary.reviewerName || 'Management'} · ${reviewedDate}`}
      icon={ShieldCheck}
    >
      <div className="mb-3 inline-flex items-center gap-1.5 pill bg-gold-300/30 text-gold-600">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        Human-reviewed before publication
      </div>
      <Section title="Strengths" body={summary.strengths} />
      <Section title="Growth areas" body={summary.growthAreas} />
      <Section title="Three small shifts to try" body={summary.threeShifts} />
      <p className="mt-4 text-xs text-stone-400">
        This summary was prepared by management using student feedback patterns and an
        external AI tool, then reviewed before publication. It is a starting point for
        professional reflection, not a verdict.
      </p>
    </Card>
  );
}

function Section({ title, body }) {
  if (!body || !body.trim()) return null;
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-navy-900 mb-1">{title}</h3>
      <p className="text-navy-800 whitespace-pre-line text-sm">{body.trim()}</p>
    </div>
  );
}