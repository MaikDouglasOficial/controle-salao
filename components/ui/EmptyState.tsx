'use client'

import { FileX, Search, Inbox, AlertCircle } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  type?: 'default' | 'search' | 'error'
}

const iconMap = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  type = 'default' 
}: EmptyStateProps) {
  const DefaultIcon = iconMap[type]
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-gray-400 dark:text-gray-600">
        {icon || <DefaultIcon className="w-16 h-16" />}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface NoResultsProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function NoResults({ searchTerm, onClearSearch }: NoResultsProps) {
  return (
    <EmptyState
      type="search"
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente usar outros termos de busca.`
          : 'Não há registros para exibir no momento.'
      }
      action={
        onClearSearch
          ? {
              label: 'Limpar busca',
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  )
}

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({ 
  title = 'Algo deu errado',
  message = 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  onRetry 
}: ErrorStateProps) {
  return (
    <EmptyState
      type="error"
      title={title}
      description={message}
      action={
        onRetry
          ? {
              label: 'Tentar novamente',
              onClick: onRetry,
            }
          : undefined
      }
    />
  )
}
