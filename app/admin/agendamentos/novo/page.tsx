'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Search, X, User, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  cpf?: string;
  photo?: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const { success, warning, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dados
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<string[]>([]);

  // Form fields
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [status, setStatus] = useState<string>('agendado');
  const [notes, setNotes] = useState<string>('');
  const [professional, setProfessional] = useState<string>('');

  const customerSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchData() {
    try {
      const [customersRes, servicesRes, professionalsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/services'),
        fetch('/api/professionals')
      ]);

      const customersData = await customersRes.json();
      const servicesData = await servicesRes.json();
      const professionalsData = await professionalsRes.json();

      setCustomers(customersData);
      setServices(servicesData);
      setProfessionals(professionalsData.filter((p: any) => p.active).map((p: any) => p.name));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (!customerSearchTerm) return false;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchLower) ||
      customer.cpf?.includes(searchLower)
    );
  }).slice(0, 5);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearchTerm(customer.name);
    setShowCustomerSuggestions(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerId('');
    setCustomerSearchTerm('');
    setShowCustomerSuggestions(false);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!customerId || !serviceId || !date) {
      warning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: Number(customerId),
          serviceId: Number(serviceId),
          date,
          status,
          notes: notes || null,
          professional: professional || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        success('Agendamento criado com sucesso!');
        router.push('/admin/agendamentos');
      } else {
        showError(data.error || 'Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      showError('Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container-app py-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <Link href="/admin/agendamentos" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors min-h-[44px] gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Novo Agendamento
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Preencha os dados para criar um novo agendamento
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Cliente */}
              <div className="relative" ref={customerSearchRef}>
                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Cliente *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-9 py-2.5 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setShowCustomerSuggestions(true);
                      if (!e.target.value) handleClearCustomer();
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    required
                  />
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Sugestões */}
                {showCustomerSuggestions && customerSearchTerm && !selectedCustomer && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {customer.photo ? (
                                <Image src={customer.photo} alt={customer.name} fill className="object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                                {customer.phone && <span>{customer.phone}</span>}
                                {customer.cpf && <span>CPF: {customer.cpf}</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500">
                        <p className="text-sm">Nenhum cliente encontrado</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Cliente Selecionado */}
                {selectedCustomer && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {selectedCustomer.photo ? (
                          <Image src={selectedCustomer.photo} alt={selectedCustomer.name} fill className="object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-green-900">{selectedCustomer.name}</div>
                        <div className="text-sm text-green-700 flex items-center gap-3 mt-1">
                          {selectedCustomer.phone && <span>Tel: {selectedCustomer.phone}</span>}
                          {selectedCustomer.cpf && <span>CPF: {selectedCustomer.cpf}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Serviço e Profissional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Serviço *</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={serviceId}
                    onChange={e => setServiceId(Number(e.target.value))}
                    required
                  >
                    <option value="">Selecione o serviço</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Profissional</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={professional}
                    onChange={e => setProfessional(e.target.value)}
                  >
                    <option value="">Selecione o profissional</option>
                    {professionals.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Data *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={date.split('T')[0] || ''}
                    onChange={e => {
                      const time = date.split('T')[1] || '09:00';
                      setDate(`${e.target.value}T${time}`);
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Horário *</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={date.split('T')[1] || '09:00'}
                    onChange={e => {
                      const dateOnly = date.split('T')[0] || new Date().toISOString().split('T')[0];
                      setDate(`${dateOnly}T${e.target.value}`);
                    }}
                    required
                  >
                    {Array.from({ length: 28 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const minute = i % 2 === 0 ? '00' : '30';
                      return `${hour.toString().padStart(2, '0')}:${minute}`;
                    }).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observações do agendamento"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/agendamentos')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar Agendamento'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
