import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * Componente Button padronizado com Design System.
 * Garante consistência visual e acessibilidade (touch targets 44px).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Base: transições, acessibilidade, estados
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg shadow-sm hover:shadow-md active:scale-[0.98]';
  
  // Variantes de cor (padronizadas)
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 border border-blue-700 dark:from-blue-500 dark:to-blue-600',
    secondary: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 focus:ring-gray-400',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 border border-green-700',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 border border-red-700',
    outline: 'bg-transparent text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-700 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-400 border border-transparent',
  };
  
  // Tamanhos padronizados (touch-friendly)
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[32px]',
    sm: 'px-3 py-2 text-sm gap-2 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm md:text-base gap-2 min-h-[40px] md:min-h-[44px]',
    lg: 'px-6 py-3 text-base gap-2.5 min-h-[44px] md:min-h-[48px]',
  };

  // Tamanho de ícones
  const iconSizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className
  );
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className={`animate-spin ${iconSizeClasses[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Carregando...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={iconSizeClasses[size]} strokeWidth={2.5} />}
          {children}
        </>
      )}
    </button>
  );
}
