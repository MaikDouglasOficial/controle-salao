import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, children, className = '' }: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {children ? <div className="flex justify-end">{children}</div> : null}
      </div>
    </div>
  );
}

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return <div className={`page-container ${className}`}>{children}</div>;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`} />
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-full mb-4 text-stone-400">
          {icon}
        </div>
      )}
      <h3 className="text-card-title text-stone-900 mb-2">{title}</h3>
      {description && (
        <p className="text-body text-stone-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}
