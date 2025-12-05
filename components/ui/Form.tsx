import React from 'react';
import { cn, components, typography, spacing } from '@/lib/design-tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className={spacing.compactGap}>
      {label && (
        <label className={cn(typography.label, 'block mb-2')} htmlFor={props.id}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          components.input.base,
          error && components.input.error,
          className
        )}
        {...props}
      />
      {error && <p className={cn(typography.error, 'mt-1.5')}>{error}</p>}
      {helperText && !error && (
        <p className={cn(typography.hint, 'mt-1.5')}>{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ label, error, helperText, className = '', ...props }: TextareaProps) {
  return (
    <div className={spacing.compactGap}>
      {label && (
        <label className={cn(typography.label, 'block mb-2')} htmlFor={props.id}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          components.input.base,
          'resize-none',
          error && components.input.error,
          className
        )}
        {...props}
      />
      {error && <p className={cn(typography.error, 'mt-1.5')}>{error}</p>}
      {helperText && !error && (
        <p className={cn(typography.hint, 'mt-1.5')}>{helperText}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, helperText, options, className = '', ...props }: SelectProps) {
  return (
    <div className={spacing.compactGap}>
      {label && (
        <label className={cn(typography.label, 'block mb-2')} htmlFor={props.id}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          components.input.base,
          error && components.input.error,
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className={cn(typography.error, 'mt-1.5')}>{error}</p>}
      {helperText && !error && (
        <p className={cn(typography.hint, 'mt-1.5')}>{helperText}</p>
      )}
    </div>
  );
}
