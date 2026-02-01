import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  cpf?: string;
  photo?: string;
}

interface AgendamentoModalProps {
  agendamento?: {
    id?: number;
    customerId?: number;
    serviceId?: number;
    date?: string;
    status?: string;
    notes?: string | undefined;
    professional?: string;
  };
  customers: Customer[];
  services: { id: number; name: string }[];
  professionals: string[];
  onSave: (agendamento: any) => void;
  onClose: () => void;
}

export default function AgendamentoModal({ agendamento, customers, services, professionals, onSave, onClose }: AgendamentoModalProps) {
  const { warning } = useToast();
  const [customerId, setCustomerId] = useState<number | ''>(agendamento?.customerId || '');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [serviceId, setServiceId] = useState<number | ''>(agendamento?.serviceId || '');
  const [date, setDate] = useState<string>(agendamento?.date || '');
  const [status, setStatus] = useState<string>(agendamento?.status || 'agendado');
  const [notes, setNotes] = useState<string>(agendamento?.notes || '');
  const [professional, setProfessional] = useState<string>(agendamento?.professional || '');
  
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Carregar cliente selecionado ao editar
  useEffect(() => {
    if (agendamento?.customerId) {
      const customer = customers.find(c => c.id === agendamento.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.name);
      }
    }
  }, [agendamento, customers]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar clientes baseado na busca
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearchTerm) return false;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchLower) ||
      customer.cpf?.includes(searchLower)
    );
  }).slice(0, 5); // Limitar a 5 sugestões

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validação
    if (!customerId || !serviceId || !date) {
      warning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    onSave({ 
      ...agendamento, 
      customerId: Number(customerId), 
      serviceId: Number(serviceId), 
      date, 
      status, 
      notes: notes || null, 
      professional: professional || null 
    });
  }

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
      subtitle={agendamento ? 'Atualize os dados do agendamento abaixo' : 'Preencha os dados para criar um novo agendamento'}
      size="xl"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="appointment-form">
            {agendamento ? 'Salvar Alterações' : 'Criar Agendamento'}
          </Button>
        </div>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="relative" ref={customerSearchRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Buscar por nome, CPF ou telefone..."
                value={customerSearchTerm}
                onChange={(e) => {
                  setCustomerSearchTerm(e.target.value);
                  setShowCustomerSuggestions(true);
                  if (!e.target.value) {
                    handleClearCustomer();
                  }
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

            {/* Sugestões de Clientes */}
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
                            <Image
                              src={customer.photo}
                              alt={customer.name}
                              fill
                              className="object-cover"
                            />
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
                    <p className="text-xs mt-1">Tente buscar por nome, CPF ou telefone</p>
                  </div>
                )}
              </div>
            )}

            {/* Cliente Selecionado */}
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {selectedCustomer.photo ? (
                        <Image
                          src={selectedCustomer.photo}
                          alt={selectedCustomer.name}
                          fill
                          className="object-cover"
                        />
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
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Serviço *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profissional</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={date.split('T')[0] || ''}
                onChange={e => {
                  const time = date.split('T')[1] || '09:00';
                  setDate(`${e.target.value}T${time}`);
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={date.split('T')[1] || '09:00'}
                onChange={e => {
                  const dateOnly = date.split('T')[0] || new Date().toISOString().split('T')[0];
                  setDate(`${dateOnly}T${e.target.value}`);
                }}
                required
              >
                <option value="08:00">08:00</option>
                <option value="08:30">08:30</option>
                <option value="09:00">09:00</option>
                <option value="09:30">09:30</option>
                <option value="10:00">10:00</option>
                <option value="10:30">10:30</option>
                <option value="11:00">11:00</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
                <option value="12:30">12:30</option>
                <option value="13:00">13:00</option>
                <option value="13:30">13:30</option>
                <option value="14:00">14:00</option>
                <option value="14:30">14:30</option>
                <option value="15:00">15:00</option>
                <option value="15:30">15:30</option>
                <option value="16:00">16:00</option>
                <option value="16:30">16:30</option>
                <option value="17:00">17:00</option>
                <option value="17:30">17:30</option>
                <option value="18:00">18:00</option>
                <option value="18:30">18:30</option>
                <option value="19:00">19:00</option>
                <option value="19:30">19:30</option>
                <option value="20:00">20:00</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações do agendamento"
            />
          </div>
        </div>
      </form>
    </ModalBase>
  );
}
