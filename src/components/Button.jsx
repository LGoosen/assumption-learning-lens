import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  { variant = 'primary', type = 'button', className = '', children, ...rest },
  ref
) {
  const base =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'gold'
      ? 'btn-gold'
      : 'btn-secondary';
  return (
    <button ref={ref} type={type} className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
});

export default Button;