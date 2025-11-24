import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <input
        className={`form-input ${error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && (
        <p className="text-body-sm text-gray-500 mt-1">{helperText}</p>
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
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <textarea
        className={`form-textarea ${error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && (
        <p className="text-body-sm text-gray-500 mt-1">{helperText}</p>
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
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      <select
        className={`form-select ${error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && (
        <p className="text-body-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}
