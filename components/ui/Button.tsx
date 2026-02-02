import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'edit' | 'orange' | 'blue-dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * Componente Button profissional e moderno.
 * Segue design system consistente com espaçamentos, tipografia e cores padronizadas.
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
  // Base: transições suaves, outline, cursor, display
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg shadow-sm hover:shadow-md active:scale-[0.98]';
  
  // Variantes de cor e estilo
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 border border-blue-700',
    secondary: 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 border border-green-700',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 border border-red-700',
    outline: 'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 hover:border-blue-700 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 border border-transparent',
    edit: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 focus:ring-indigo-400',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 border border-orange-600',
    'blue-dark': 'bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 focus:ring-blue-700 border border-blue-800',
  };
  
  // Tamanhos com espaçamentos e tipografia consistentes (responsivos)
  const sizeClasses = {
    xs: 'px-2 xs:px-3 py-1 xs:py-1.5 text-xs gap-1 xs:gap-1.5',
    sm: 'px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm gap-1.5 xs:gap-2',
    md: 'px-4 xs:px-5 py-2 xs:py-2.5 text-sm xs:text-base gap-1.5 xs:gap-2',
    lg: 'px-5 xs:px-6 py-2.5 xs:py-3 text-sm xs:text-base gap-2 xs:gap-2.5',
    xl: 'px-6 xs:px-8 py-3 xs:py-4 text-base xs:text-lg gap-2 xs:gap-3',
  };

  // Tamanho do ícone proporcional ao tamanho do botão
  const iconSizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`.trim();
  
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
