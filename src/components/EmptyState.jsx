import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'Nothing here yet',
  description,
  icon: Icon = Inbox,
  action,
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-50 text-stone-400 mb-3">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}