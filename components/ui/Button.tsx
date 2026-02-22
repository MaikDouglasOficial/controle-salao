import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = dourado (Salvar, Continuar, Adicionar). secondary = Cancelar/Voltar. success = Confirmar/Finalizar. danger = Cancelar agendamento/Excluir. warning = atenção. */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'edit' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * Botões padronizados — cores por tipo de ação:
 * primary = dourado/âmbar (marca): Salvar, Continuar, Adicionar, Novo agendamento
 * secondary = neutro: Cancelar, Voltar, Fechar
 * success = verde: Confirmar agendamento, Finalizar serviço, Agendar (concluir)
 * danger = vermelho: Cancelar agendamento, Confirmar cancelamento, Excluir
 * warning = âmbar atenção: uso pontual para avisos
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
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg shadow-sm hover:shadow-md active:scale-[0.98]';

  const variantClasses: Record<string, string> = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 border border-amber-600',
    secondary: 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 hover:border-stone-400 focus:ring-stone-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 border border-emerald-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-red-600',
    outline: 'bg-transparent text-amber-700 border border-amber-600 hover:bg-amber-50 focus:ring-amber-500',
    ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 focus:ring-stone-300 border border-transparent',
    edit: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 focus:ring-amber-300',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 border border-amber-500',
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
