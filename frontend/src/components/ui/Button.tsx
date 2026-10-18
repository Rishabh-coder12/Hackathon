import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  let variantClass = 'btn-primary';
  if (variant === 'secondary') variantClass = 'btn-secondary';
  if (variant === 'destructive') variantClass = 'btn-destructive';

  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
