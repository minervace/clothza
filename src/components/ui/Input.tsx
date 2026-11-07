// ============================================================
// components/ui/Input.tsx — Clothza v4.0
// Controlled input with label, error state, focus ring animation
// ============================================================

import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      id: externalId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div
        className={clsx(containerClassName)}
        style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        {label && (
          <label htmlFor={id} className="label-base">
            {label}
            {props.required && (
              <span aria-hidden="true" style={{ color: 'var(--danger)', marginLeft: 4 }}>
                *
              </span>
            )}
          </label>
        )}

        <div style={{ position: 'relative' }}>
          {leftIcon && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            aria-invalid={error ? 'true' : undefined}
            className={clsx(
              'input-base',
              error && 'input-error',
              leftIcon  && 'pl-input-icon-left',
              rightIcon && 'pl-input-icon-right',
              className
            )}
            style={{
              paddingLeft:  leftIcon  ? 40 : undefined,
              paddingRight: rightIcon ? 40 : undefined,
            }}
            {...props}
          />

          {rightIcon && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                pointerEvents: 'none',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="input-error-message" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${id}-hint`}
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--text-tertiary)',
              marginTop: 2,
            }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── Textarea variant ─────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, containerClassName, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div className={clsx(containerClassName)} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label htmlFor={id} className="label-base">
            {label}
            {props.required && (
              <span aria-hidden="true" style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={clsx('input-base', error && 'input-error', className)}
          style={{ resize: 'vertical', minHeight: 100 }}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="input-error-message" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        {hint && !error && (
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
