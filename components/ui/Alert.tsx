import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
};

const alertClasses = {
  success: 'alert-success',
  warning: 'alert-warning',
  danger: 'alert-danger',
  info: 'alert-info',
};

export function Alert({ variant, title, children, className = '' }: AlertProps) {
  const Icon = alertIcons[variant];
  const classes = `${alertClasses[variant]} ${className}`;
  
  return (
    <div className={classes}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-medium mb-1">{title}</div>}
        <div className="text-body-sm">{children}</div>
      </div>
    </div>
  );
}
