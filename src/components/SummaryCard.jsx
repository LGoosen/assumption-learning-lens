import Card from './Card.jsx';

/**
 * A simple list card with a heading and friendly bullets.
 * Used for "Strengths", "Growth areas", "Three shifts", etc.
 */
export default function SummaryCard({
  title,
  subtitle,
  icon,
  items = [],
  emptyText = 'No clear pattern yet.',
  ordered = false,
  bulletColor = 'gold',
}) {
  const dotClass =
    bulletColor === 'navy' ? 'bg-navy-400' : 'bg-gold-500';
  const Tag = ordered ? 'ol' : 'ul';

  return (
    <Card title={title} subtitle={subtitle} icon={icon}>
      {items.length === 0 ? (
        <p className="text-stone-500 text-sm">{emptyText}</p>
      ) : (
        <Tag className={`space-y-2 ${ordered ? 'list-decimal list-inside' : ''}`}>
          {items.map((text, idx) => (
            <li key={idx} className="text-navy-800 flex gap-2">
              {!ordered && (
                <span
                  className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`}
                  aria-hidden="true"
                />
              )}
              <span>{text}</span>
            </li>
          ))}
        </Tag>
      )}
    </Card>
  );
}