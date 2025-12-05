import React from 'react';
import { cn, colors, components } from '@/lib/design-tokens';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const variantClasses = {
    success: colors.badge.success,
    warning: colors.badge.warning,
    danger: colors.badge.danger,
    info: colors.badge.info,
    gray: colors.badge.gray,
  };
  
  return (
    <span className={cn(
      components.badge.base,
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

// Função helper para mapear status para variantes de badge
export function getStatusBadgeVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    'CONFIRMADO': 'success',
    'PENDENTE': 'warning',
    'CANCELADO': 'danger',
    'CONCLUIDO': 'info',
    'ATIVO': 'success',
    'INATIVO': 'gray',
  };
  
  return statusMap[status.toUpperCase()] || 'gray';
}

// Função helper para formatar texto de status
export function formatStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'CONFIRMADO': 'Confirmado',
    'PENDENTE': 'Pendente',
    'CANCELADO': 'Cancelado',
    'CONCLUIDO': 'Concluído',
    'ATIVO': 'Ativo',
    'INATIVO': 'Inativo',
  };
  
  return statusMap[status.toUpperCase()] || status;
}
