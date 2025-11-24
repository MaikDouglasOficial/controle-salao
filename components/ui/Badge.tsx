import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'badge-gray',
  };
  
  const classes = `${variantClasses[variant]} ${className}`;
  
  return <span className={classes}>{children}</span>;
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
