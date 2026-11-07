// ============================================================
// components/ui/Button.tsx — Clothza v4.0
// 5 variants: primary, ghost, accent, danger, outline
// All micro-interactions: scale(1.02) hover, scale(0.98) active
// ============================================================

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger';
type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  pill?:      boolean;
  isLoading?: boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'button' | 'a';
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn btn-primary',
  accent:  'btn btn-accent',
  ghost:   'btn btn-ghost',
  outline: 'btn btn-outline',
  danger:  'btn btn-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          variantClasses[variant],
          sizeClasses[size],
          pill && 'btn-pill',
          className
        )}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2
              size={16}
              className="spin-slow"
              aria-hidden="true"
            />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon  && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ── Icon Button Variant ──────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  label:    string; // Required aria-label for accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', label, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={clsx(
          variantClasses[variant],
          'btn-icon',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;
