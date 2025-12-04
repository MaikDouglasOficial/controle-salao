'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Eye, Users } from 'lucide-react'
import { formatPhone, formatDate } from '@/lib/utils'
import { SkeletonTable, NoResults, ErrorState } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/Toast'
import { OptimizedAvatar } from '@/components/OptimizedImage'
import { useCustomers, useDeleteCustomer } from '@/hooks/useApi'

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  birthday: string | null
  notes: string | null
  photo: string | null
  cpf: string | null
}

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // React Query hooks - substituindo fetch manual
  const { data: customers = [], isLoading, isError, error } = useCustomers()
  const deleteMutation = useDeleteCustomer()

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id.toString())
    setDeleteId(null)
  }

  // Memoizar filtro para evitar recalcular em cada render
  const filteredCustomers = useMemo(() => {
    if (!customers) return []
    
    return customers.filter((customer: Customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpf?.includes(searchTerm)
    )
  }, [customers, searchTerm])

  return (
    <div className="container-app py-6">
      {/* Header */}
      <div className="spacing-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus clientes cadastrados
            </p>
          </div>
          <Link
            href="/admin/clientes/novo"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Cliente</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="spacing-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Content */}
      {isError ? (
        <ErrorState message={error?.message || 'Erro ao carregar clientes'} />
      ) : isLoading ? (
        <SkeletonTable />
      ) : filteredCustomers.length === 0 ? (
        <NoResults
          searchTerm={searchTerm}
          onClearSearch={searchTerm ? () => setSearchTerm('') : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aniversário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer: Customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <OptimizedAvatar
                          src={customer.photo}
                          alt={customer.name}
                          size="md"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {customer.name}
                          </div>
                          {customer.cpf && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              CPF: {customer.cpf}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatPhone(customer.phone)}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {customer.birthday ? formatDate(customer.birthday) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors touch-target"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/clientes/${customer.id}/editar`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors touch-target"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(customer.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-target"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCustomers.map((customer: Customer) => (
              <div key={customer.id} className="p-4">
                <div className="flex items-start gap-4">
                  <OptimizedAvatar
                    src={customer.photo}
                    alt={customer.name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatPhone(customer.phone)}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {customer.email}
                      </p>
                    )}
                    {customer.birthday && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Aniversário: {formatDate(customer.birthday)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/admin/clientes/${customer.id}`}
                    className="flex-1 btn-secondary text-center"
                  >
                    <Eye className="h-4 w-4 inline mr-2" />
                    Ver
                  </Link>
                  <Link
                    href={`/admin/clientes/${customer.id}/editar`}
                    className="flex-1 btn-primary text-center"
                  >
                    <Pencil className="h-4 w-4 inline mr-2" />
                    Editar
                  </Link>
                  <button
                    onClick={() => setDeleteId(customer.id)}
                    className="btn-danger px-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmDialog
          title="Excluir Cliente"
          message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
          type="danger"
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
