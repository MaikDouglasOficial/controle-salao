import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { cn, typography, spacing } from '@/lib/design-tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
}

/**
 * Header padronizado para páginas.
 * Inclui título, subtítulo opcional, botão voltar e ações.
 */
export function StandardPageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Voltar',
  actions,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className={cn(spacing.sectionGap)}>
      {/* Back button */}
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors min-h-[44px] gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{backLabel}</span>
        </Link>
      )}

      {/* Title and actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            )}
            <h1 className={typography.pageTitle}>{title}</h1>
          </div>
          {subtitle && <p className={typography.pageSubtitle}>{subtitle}</p>}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
}

/**
 * Header padronizado para seções dentro de páginas.
 */
export function StandardSectionHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          <h2 className={typography.sectionTitle}>{title}</h2>
        </div>
        {subtitle && <p className={typography.sectionSubtitle}>{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
}

/**
 * Header padronizado para cards.
 */
export function StandardCardHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          <h3 className={typography.cardTitle}>{title}</h3>
        </div>
        {subtitle && <p className={typography.cardSubtitle}>{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
