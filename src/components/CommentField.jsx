import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { moderateComment } from '../utils/moderation.js';

/**
 * Optional comment field with live moderation feedback.
 *
 * Behaviour:
 *  - Debounces moderation by ~400ms while typing so it doesn't flicker.
 *  - On flag, shows a respectful prompt to rewrite (NOT a punishment).
 *  - Reports moderation status upward via onModerationChange so the
 *    parent form can decide whether submission is allowed.
 */
export default function CommentField({
  questionId,
  questionText,
  value,
  onChange,
  onModerationChange,
  maxLength = 500,
}) {
  const [moderation, setModeration] = useState({ status: 'clean', reasons: [], suggestion: null });

  useEffect(() => {
    const handle = setTimeout(() => {
      const result = moderateComment(value || '');
      setModeration(result);
      onModerationChange?.(questionId, result);
    }, 400);
    return () => clearTimeout(handle);
  }, [value, questionId, onModerationChange]);

  const remaining = maxLength - (value?.length || 0);
  const isFlagged = moderation.status === 'flagged';
  const isClean = moderation.status === 'clean' && (value || '').trim().length > 0;

  return (
    <div>
      <label
        htmlFor={questionId}
        className="block text-base font-medium text-navy-900 mb-2"
      >
        {questionText}
        <span className="ml-2 text-xs font-normal text-stone-400">(optional)</span>
      </label>

      <textarea
        id={questionId}
        name={questionId}
        rows={3}
        maxLength={maxLength}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={isFlagged}
        aria-describedby={`${questionId}-help`}
        className={`input-field resize-y ${
          isFlagged ? 'border-gold-500 focus:border-gold-600 focus:ring-gold-200' : ''
        }`}
        placeholder="Share something specific and constructive…"
      />

      <div
        id={`${questionId}-help`}
        className="mt-1 flex items-center justify-between text-xs"
      >
        <span className="text-stone-400">
          {isClean && (
            <span className="inline-flex items-center gap-1 text-navy-700">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Looks constructive — thank you.
            </span>
          )}
        </span>
        <span className="text-stone-400">{remaining} characters left</span>
      </div>

      {isFlagged && (
        <div
          role="status"
          className="mt-2 rounded-lg border border-gold-300 bg-gold-300/15 p-3 text-sm text-navy-900"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="w-4 h-4 mt-0.5 text-gold-600 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium">Could you rephrase this?</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                {moderation.reasons.map((r) => (
                  <li key={r} className="text-navy-800">
                    {r}
                  </li>
                ))}
              </ul>
              {moderation.suggestion && (
                <p className="mt-2 text-navy-800">{moderation.suggestion}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}