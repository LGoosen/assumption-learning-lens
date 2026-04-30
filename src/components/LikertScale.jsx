import { LIKERT_OPTIONS } from '../utils/constants.js';

/**
 * Accessible 1–5 Likert input. Renders as a radiogroup so screen readers
 * announce the question and options properly.
 *
 * Visually it's a row of pill buttons on small screens and labelled
 * radio cards on larger screens.
 */
export default function LikertScale({
  questionId,
  questionText,
  value,
  onChange,
  required = true,
}) {
  return (
    <fieldset>
      <legend className="block text-base font-medium text-navy-900 mb-3">
        {questionText}
        {required && <span className="text-gold-600 ml-1" aria-hidden="true">*</span>}
      </legend>

      <div
        role="radiogroup"
        aria-label={questionText}
        className="grid grid-cols-5 gap-1.5 sm:gap-2"
      >
        {LIKERT_OPTIONS.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`group cursor-pointer rounded-lg border text-center px-1.5 py-2.5 transition-colors
                ${
                  checked
                    ? 'bg-navy-800 border-navy-800 text-white shadow-soft'
                    : 'bg-white border-stone-200 text-navy-800 hover:border-navy-400 hover:bg-stone-50'
                }`}
            >
              <input
                type="radio"
                name={questionId}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
                required={required}
                aria-label={`${opt.value} — ${opt.label}`}
              />
              <span className="block text-lg font-semibold leading-none">
                {opt.value}
              </span>
              <span className="block text-[11px] sm:text-xs mt-1 leading-tight">
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}