import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button.jsx';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onClose,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    cancelRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div
        className="absolute inset-0 bg-navy-900/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl2 shadow-card border border-stone-100 max-w-md w-full p-5">
        <div className="flex items-start gap-3">
          <span
            className={
              'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ' +
              (destructive
                ? 'bg-gold-300/30 text-gold-600'
                : 'bg-navy-50 text-navy-700')
            }
            aria-hidden="true"
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold text-navy-900">
              {title}
            </h2>
            {description ? (
              <p id="confirm-desc" className="mt-1 text-sm text-stone-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 hover:text-navy-900 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={onClose} ref={cancelRef}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'gold' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}