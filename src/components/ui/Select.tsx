// ============================================================
// components/ui/Select.tsx — Clothza v4.0
// Custom styled select dropdown — native <select> with CSS skin
// ============================================================

import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:        string;
  error?:        string;
  hint?:         string;
  options:       SelectOption[];
  placeholder?:  string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
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

        {/* Wrapper for custom chevron overlay */}
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            id={id}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={clsx('input-base', error && 'input-error', className)}
            style={{ paddingRight: 36, cursor: 'pointer' }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom chevron — always on top */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <ChevronDown size={16} />
          </span>
        </div>

        {error && (
          <p
            id={`${id}-error`}
            className="input-error-message"
            role="alert"
            aria-live="polite"
          >
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

Select.displayName = 'Select';

export default Select;
