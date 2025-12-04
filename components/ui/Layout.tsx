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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {children}
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

// LoadingSpinner e EmptyState foram movidos para componentes especializados:
// - LoadingSpinner, LoadingOverlay, Skeleton: components/ui/Loading.tsx
// - EmptyState, NoResults, ErrorState: components/ui/EmptyState.tsx
