import React from 'react';
import { cn, components, typography } from '@/lib/design-tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', hover = false, onClick, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };
  
  return (
    <div 
      className={cn(
        components.card.base,
        hover && components.card.hover,
        paddingClasses[padding],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn(components.card.header, className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className={typography.cardTitle}>{title}</h3>
          {subtitle && <p className={typography.cardSubtitle}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={cn('p-4 md:p-6', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={cn('px-4 md:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700', className)}>
      {children}
    </div>
  );
}
