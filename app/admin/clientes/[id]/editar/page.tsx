'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui'
import Link from 'next/link'
import Image from 'next/image'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const id = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    aniversario: '',
    observacoes: '',
    photo: '',
  })

  useEffect(() => {
    if (id) {
      fetchCustomer()
    }
  }, [id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${id}`)
      
      if (!response.ok) throw new Error('Cliente não encontrado')
      
      const customer = await response.json()
      setForm({
        nome: customer.name || '',
        email: customer.email || '',
        telefone: customer.phone || '',
        cpf: customer.cpf || '',
        aniversario: customer.birthday || '',
        observacoes: customer.notes || '',
        photo: customer.photo || '',
      })
      setPhotoPreview(customer.photo)
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      toast.error('Erro ao carregar dados do cliente')
      router.push('/admin/clientes')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        setForm((f) => ({ ...f, photo: url }))
        setPhotoPreview(url)
        toast.success('Foto atualizada')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao fazer upload')
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao fazer upload da foto')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = () => {
    setForm((f) => ({ ...f, photo: '' }))
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nome,
          email: form.email,
          phone: form.telefone,
          cpf: form.cpf,
          birthday: form.aniversario,
          notes: form.observacoes,
          photo: form.photo || null,
        }),
      })
      
      if (response.ok) {
        toast.success('Cliente atualizado com sucesso!')
        router.push(`/admin/clientes/${id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar cliente')
      }
    } catch (error) {
      toast.error('Erro ao atualizar cliente')
    }
  }

  if (loading) {
    return (
      <div className="container-app py-6 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-app py-6 spacing-section">
        <div className="flex items-center gap-4 spacing-card">
          <Link href={`/admin/clientes/${id}`}>
            <Button variant="ghost" icon={ArrowLeft} size="sm">
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
              Editar Cliente
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Atualize as informações do cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto do Cliente
            </label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors touch-target"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    icon={Camera}
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Enviando...' : 'Alterar Foto'}
                  </Button>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                id="telefone"
                required
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="aniversario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="aniversario"
                value={form.aniversario}
                onChange={(e) => setForm({ ...form, aniversario: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                id="observacoes"
                rows={4}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/clientes/${id}`)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
