export default function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const base =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'gold'
      ? 'btn-gold'
      : 'btn-secondary';
  return (
    <button type={type} className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}