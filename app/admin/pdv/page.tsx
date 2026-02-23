'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, User, Package, Camera, X, CreditCard, Banknote } from 'lucide-react';
import { useVendaCompleta, type MetodoPagamento } from '@/hooks/useVendaCompleta';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { fetchAuth } from '@/lib/api';
import Image from 'next/image';
import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Layout';
import { useToast } from '@/hooks/useToast';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  photo?: string;
  sku?: string | null;
}

interface Service {
  id: number;
  name: string;
  price: number;
  sku?: string | null;
}

interface CartItem {
  type: 'product' | 'service';
  id: number;
  name: string;
  price: number;
  quantity: number;
  sku?: string | null;
}

interface Professional {
  id: number;
  name: string;
  active: boolean;
}

export default function PDVPage() {
  const { success, error, info, confirm } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCustomerNotFoundModal, setShowCustomerNotFoundModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    customerId: '',
    professional: '',
    paymentMethod: 'DINHEIRO',
    installments: 1,
    installmentValue: 0,
    entradaValue: 0,
    entradaMethod: 'DINHEIRO',
    restanteMethod: 'CARTAO_CREDITO',
    restanteInstallments: 12,
    restanteInstallmentValue: 0,
  });
  const [discountDisplay, setDiscountDisplay] = useState<string | null>(null);
  const [tempPriceDisplay, setTempPriceDisplay] = useState<string | null>(null);
  const [metodoTemp, setMetodoTemp] = useState<MetodoPagamento>('PIX');
  const [parcelasTemp, setParcelasTemp] = useState(1);
  const [valorTemp, setValorTemp] = useState('');
  const [valorTempDisplay, setValorTempDisplay] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birthday: '',
    notes: '',
    photo: '',
  });
  const [discountType, setDiscountType] = useState<'percent' | 'value'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<{type: 'product' | 'service', id: number, name: string, price: number, stock?: number, sku?: string | null} | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [editingPrices, setEditingPrices] = useState<{[key: string]: string}>({});
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, []);

  useEffect(() => {
    // Carrega dados do agendamento depois que os clientes forem carregados
    if (customers.length > 0) {
      loadAppointmentData();
    }
  }, [customers]);


  const loadAppointmentData = () => {
    // Carrega dados do agendamento se existir
    const savedData = localStorage.getItem('pdv_appointment_data');
    if (savedData) {
      try {
        const appointmentData = JSON.parse(savedData);
        console.log('📋 Carregando dados do agendamento para PDV:', appointmentData);
        
        // Adiciona o serviço ao carrinho com o preço EXATO do agendamento
        const serviceItem: CartItem = {
          type: 'service',
          id: appointmentData.serviceId,
          name: appointmentData.serviceName,
          price: Number(appointmentData.servicePrice), // Garantir que é número
          quantity: 1
        };
        
        console.log('Adicionando serviço ao carrinho:', serviceItem);
        setCart([serviceItem]); // Iniciar carrinho com o serviço
        
        // Encontra e seleciona o cliente
        const customer = customers.find((c: any) => c.id === appointmentData.customerId);
        if (customer) {
          console.log('Cliente selecionado:', customer.name);
          setSelectedCustomer(customer);
          setCustomerSearchTerm(customer.name);
        }
        
        // Pré-seleciona o cliente e o profissional
        setCheckoutData(prev => ({
          ...prev,
          customerId: appointmentData.customerId.toString(),
          professional: appointmentData.professional || '',
        }));

        setAppointmentId(appointmentData.appointmentId || null);
        
        // Limpa os dados salvos
        localStorage.removeItem('pdv_appointment_data');
        
        // Mostra mensagem de sucesso
        setTimeout(() => {
          info(`Agendamento carregado!\n\nCliente: ${appointmentData.customerName}\nServiço: ${appointmentData.serviceName}\nValor: R$ ${appointmentData.servicePrice.toFixed(2)}\n\nAdicione produtos extras se necessário e finalize a venda.`);
        }, 500);
      } catch (err) {
        console.error('ERRO: Erro ao carregar dados do agendamento:', err);
        error('Erro ao carregar dados do agendamento. Tente novamente.');
      }
    }
  };

  const fetchData = async (signal?: AbortSignal) => {
    try {
      const init = signal ? { signal } : undefined;
      const [productsRes, servicesRes, customersRes, professionalsRes] = await Promise.all([
        fetchAuth('/api/products', init),
        fetchAuth('/api/services', init),
        fetchAuth('/api/customers', init),
        fetchAuth('/api/professionals', init),
      ]);

      if (signal?.aborted) return;

      const productsData = await productsRes.json();
      const servicesData = await servicesRes.json();
      const customersData = await customersRes.json();
      const professionalsData = await professionalsRes.json();

      if (signal?.aborted) return;

      setProducts(Array.isArray(productsData) ? productsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProfessionals((Array.isArray(professionalsData) ? professionalsData : []).filter((p: Professional) => p.active));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Erro ao buscar dados:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const openAddItemModal = (item: { type: 'product' | 'service'; id: number; name: string; price: number; stock?: number; sku?: string | null }) => {
    setItemToAdd(item);
    setTempPrice(item.price);
    setTempQuantity(1);
    setShowAddItemModal(true);
  };

  const confirmAddToCart = () => {
    if (!itemToAdd) return;

    const existingItem = cart.find((i) => i.type === itemToAdd.type && i.id === itemToAdd.id);
    
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.type === itemToAdd.type && i.id === itemToAdd.id
            ? { ...i, quantity: i.quantity + tempQuantity, price: tempPrice }
            : i
        )
      );
    } else {
      setCart([...cart, { type: itemToAdd.type, id: itemToAdd.id, name: itemToAdd.name, price: tempPrice, quantity: tempQuantity, sku: itemToAdd.sku ?? null }]);
    }

    setShowAddItemModal(false);
    setItemToAdd(null);
  };

  const addToCart = (item: { type: 'product' | 'service'; id: number; name: string; price: number }) => {
    const existingItem = cart.find((i) => i.type === item.type && i.id === item.id);
    
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.type === item.type && i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (type: string, id: number) => {
    setCart(cart.filter((item) => !(item.type === type && item.id === id)));
  };

  const updateQuantity = (type: string, id: number, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.type === type && item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const updatePrice = (type: string, id: number, newPrice: number) => {
    setCart(
      cart.map((item) => {
        if (item.type === type && item.id === id) {
          return { ...item, price: Math.max(0, newPrice) };
        }
        return item;
      })
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const discountAmount = discountType === 'percent' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  
  const total = Math.max(0, subtotal - discountAmount);

  const venda = useVendaCompleta(total);
  const { pagamentos, resumo, adicionarPagamento, removerPagamento, limparPagamentos } = venda;

  const prevCheckoutOpen = useRef(false);
  useEffect(() => {
    if (showCheckoutModal && !prevCheckoutOpen.current) {
      limparPagamentos();
    }
    prevCheckoutOpen.current = showCheckoutModal;
  }, [showCheckoutModal, limparPagamentos]);

  const finalizeSale = async () => {
    if (cart.length === 0) {
      error('Carrinho vazio!');
      return;
    }

    if (!checkoutData.professional || checkoutData.professional.trim() === '') {
      error('Por favor, informe o profissional que realizou o atendimento!');
      return;
    }

    if (!resumo.contaFechada) {
      error(`A soma dos pagamentos deve ser igual ao total (R$ ${total.toFixed(2)}). Faltam R$ ${resumo.restante.toFixed(2)}.`);
      return;
    }

    if (pagamentos.length === 0) {
      error('Adicione pelo menos uma forma de pagamento.');
      return;
    }

    try {
      const payments = pagamentos.map((p) => ({
        paymentMethod: p.metodo,
        value: p.valor,
        installments: p.metodo === 'CARTAO_CREDITO' ? (p.parcelas ?? 1) : undefined,
      }));

      const saleData: any = {
        customerId: checkoutData.customerId ? parseInt(checkoutData.customerId) : null,
        professional: checkoutData.professional,
        total,
        payments,
        items: cart.map(item => ({
          type: item.type,
          productId: item.type === 'product' ? item.id : null,
          serviceId: item.type === 'service' ? item.id : null,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      if (appointmentId) {
        saleData.appointmentId = appointmentId;
      }

      const response = await fetchAuth('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        success('Venda finalizada com sucesso!');
        setCart([]);
        setShowCheckoutModal(false);
        limparPagamentos();
        setCheckoutData({ customerId: '', professional: '', paymentMethod: 'DINHEIRO', installments: 1, installmentValue: 0, entradaValue: 0, entradaMethod: 'DINHEIRO', restanteMethod: 'CARTAO_CREDITO', restanteInstallments: 12, restanteInstallmentValue: 0 });
        setAppointmentId(null);
        fetchData();
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao finalizar venda');
      }
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      error('Erro ao finalizar venda');
    }
  };

  const clearCart = async () => {
    const confirmed = await confirm({
      title: 'Limpar carrinho',
      message: 'Tem certeza que deseja limpar o carrinho?',
      type: 'warning'
    });
    if (confirmed) {
      setCart([]);
    }
  };

  // Sugestões em tempo real ao digitar (para o modal de checkout)
  const customerSuggestionsList = useMemo(() => {
    const term = customerSearchTerm.trim().toLowerCase();
    if (!term || term.length < 1) return [];
    const cleanDigits = term.replace(/\D/g, '');
    return customers
      .filter((c: any) => {
        const nameMatch = c.name?.toLowerCase().includes(term);
        const phoneMatch = c.phone?.replace(/\D/g, '').includes(cleanDigits) || (cleanDigits.length >= 4 && c.phone?.replace(/\D/g, '').includes(cleanDigits));
        const cpfMatch = cleanDigits.length >= 6 && c.cpf?.replace(/\D/g, '').includes(cleanDigits);
        return nameMatch || phoneMatch || cpfMatch;
      })
      .slice(0, 8);
  }, [customers, customerSearchTerm]);

  const selectCustomerFromSuggestion = (customer: any) => {
    setSelectedCustomer(customer);
    setCheckoutData((prev) => ({ ...prev, customerId: customer.id.toString() }));
    setCustomerSearchTerm(customer.name);
    setShowSuggestions(false);
  };

  const searchCustomer = () => {
    const term = customerSearchTerm.trim();
    if (!term) {
      error('Digite o CPF, telefone ou nome do cliente para buscar');
      return;
    }

    const cleanTerm = term.replace(/[^\w\s]/g, '').toLowerCase();
    
    if (/^\d{11,14}$/.test(cleanTerm)) {
      const found = customers.find((c: any) => 
        c.cpf?.replace(/[^\d]/g, '') === cleanTerm
      );
      if (found) {
        setSelectedCustomer(found);
        setCheckoutData((prev) => ({ ...prev, customerId: found.id.toString() }));
        setCustomerSearchTerm(found.name);
        return;
      }
    }

    if (/^\d{10,11}$/.test(cleanTerm)) {
      const found = customers.find((c: any) => 
        c.phone?.replace(/[^\d]/g, '').includes(cleanTerm)
      );
      if (found) {
        setSelectedCustomer(found);
        setCheckoutData((prev) => ({ ...prev, customerId: found.id.toString() }));
        setCustomerSearchTerm(found.name);
        return;
      }
    }

    const found = customers.find((c: any) =>
      c.name.toLowerCase().includes(term.toLowerCase())
    );
    if (found) {
      setSelectedCustomer(found);
      setCheckoutData((prev) => ({ ...prev, customerId: found.id.toString() }));
      setCustomerSearchTerm(found.name);
    } else {
      setShowCustomerNotFoundModal(true);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione uma imagem');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchAuth('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setNewCustomerData({ ...newCustomerData, photo: url });
        setPhotoPreview(url);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setNewCustomerData({ ...newCustomerData, photo: '' });
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegisterNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      error('Nome e telefone são obrigatórios!');
      return;
    }

    try {
      const response = await fetchAuth('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerData.name,
          email: newCustomerData.email || null,
          phone: newCustomerData.phone,
          cpf: newCustomerData.cpf || null,
          birthday: newCustomerData.birthday || null,
          notes: newCustomerData.notes || null,
          photo: newCustomerData.photo || null,
        }),
      });

      if (response.ok) {
        const customer = await response.json();
        success('Cliente cadastrado com sucesso!');
        setShowNewCustomerModal(false);
        setShowCustomerNotFoundModal(false);
        setNewCustomerData({ name: '', email: '', phone: '', cpf: '', birthday: '', notes: '', photo: '' });
        setPhotoPreview(null);
        setCustomerSearchTerm('');
        
        // Recarrega lista de clientes
        await fetchData();
        
        // Seleciona o cliente recém-cadastrado
        setSelectedCustomer(customer);
        setCheckoutData({ ...checkoutData, customerId: customer.id.toString() });
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao cadastrar cliente');
      }
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
      error('Erro ao cadastrar cliente');
    }
  };

  // Lista unificada: produtos + serviços, ordenada por nome; filtro só na pesquisa (hooks antes de qualquer return)
  const combinedItems = useMemo(() => {
    const fromProducts = products.map((p) => ({ type: 'product' as const, id: p.id, name: p.name, price: p.price, stock: p.stock, photo: p.photo, sku: p.sku ?? null }));
    const fromServices = services.map((s) => ({ type: 'service' as const, id: s.id, name: s.name, price: s.price, sku: s.sku ?? null }));
    const combined = [...fromProducts, ...fromServices];
    combined.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return combined;
  }, [products, services]);

  const filteredItems = useMemo(() => {
    let list = combinedItems;
    if (typeFilter !== 'all') {
      list = list.filter((item) => item.type === typeFilter);
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) => {
      const matchName = item.name.toLowerCase().includes(term);
      const matchSku = item.sku && item.sku.toLowerCase().includes(term);
      return matchName || matchSku;
    });
  }, [combinedItems, searchTerm, typeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in mt-6">
      <div className="page-header">
        <h1 className="page-title">PDV</h1>
        <p className="page-subtitle">Ponto de venda</p>
      </div>

      {/* Busca e filtro — mesmo estilo das páginas Produtos e Serviços */}
      <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-1 pb-2 -mx-1 px-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('product')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'product' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                Produtos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('service')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'service' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                Serviços
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área única: Produtos e Serviços unificados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Produtos e Serviços
              </h2>
              <span className="text-xs text-gray-500">
                {searchTerm.trim() || typeFilter !== 'all'
                  ? `${filteredItems.length} de ${typeFilter === 'all' ? combinedItems.length : combinedItems.filter((i) => i.type === typeFilter).length}`
                  : `${combinedItems.length} itens`}
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="min-h-[200px] flex items-center justify-center px-5 py-10 text-center text-sm text-gray-500">
                {searchTerm.trim() || typeFilter !== 'all' ? 'Nenhum item encontrado para esta pesquisa ou filtro.' : 'Nenhum produto ou serviço cadastrado.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                {filteredItems.map((item) => (
                  <button
                    key={item.type === 'product' ? `p-${item.id}` : `s-${item.id}`}
                    onClick={() =>
                      item.type === 'product'
                        ? openAddItemModal({ type: 'product', id: item.id, name: item.name, price: item.price, stock: item.stock, sku: item.sku })
                        : openAddItemModal({ type: 'service', id: item.id, name: item.name, price: item.price, sku: item.sku })
                    }
                    className="group flex items-center gap-3 rounded-lg p-3 border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-colors"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-stone-100">
                      {item.type === 'product' && item.photo ? (
                        <Image src={item.photo} alt={item.name} fill className="object-cover" />
                      ) : item.type === 'product' ? (
                        <Package className="h-5 w-5 text-gray-400" />
                      ) : (
                        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-500 mt-0.5">Cód. {item.sku}</p>}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.type === 'product' && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              item.stock > 10 ? 'bg-emerald-50 text-emerald-700' : item.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {item.stock} un.
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{item.type === 'product' ? 'Produto' : 'Serviço'}</span>
                        <span className="text-sm font-semibold text-amber-600">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-amber-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

          {/* Carrinho - Ocupa 1 de 3 colunas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 sticky top-4 overflow-hidden">
              <div className="px-4 py-3 bg-stone-900 border-b border-stone-700/50 flex items-center justify-between rounded-t-xl">
                <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-amber-400" />
                  Carrinho ({cart.length})
                </h2>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-sm text-stone-400 hover:text-red-400 font-medium">
                    Limpar
                  </button>
                )}
              </div>

              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="h-12 w-12 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-500">Carrinho vazio</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[calc(100vh-340px)] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-stone-50">
                          <tr className="border-b border-stone-200">
                            <th className="px-2 py-2 text-left text-stone-600 font-medium">Item</th>
                            <th className="px-1 py-2 text-center text-stone-600 font-medium w-16">Qtd</th>
                            <th className="px-1 py-2 text-right text-stone-600 font-medium w-20">Unit.</th>
                            <th className="px-2 py-2 text-right text-stone-600 font-medium w-20">Total</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {cart.map((item, index) => (
                            <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-stone-50/50">
                              <td className="px-2 py-2">
                                <p className="text-stone-900 font-medium line-clamp-2">{item.name}</p>
                                {item.sku && <p className="text-stone-500 text-[10px]">Cód. {item.sku}</p>}
                                <p className="text-stone-400 text-[10px]">{item.type === 'product' ? 'Produto' : 'Serviço'}</p>
                              </td>
                              <td className="px-1 py-2">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button type="button" onClick={() => updateQuantity(item.type, item.id, -1)} className="h-6 w-6 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded text-stone-600">
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-semibold text-stone-900 min-w-[20px] text-center">{item.quantity}</span>
                                  <button type="button" onClick={() => updateQuantity(item.type, item.id, 1)} className="h-6 w-6 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded text-stone-600">
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-1 py-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={(() => {
                                    const key = `${item.type}-${item.id}`;
                                    if (editingPrices[key] !== undefined) return editingPrices[key];
                                    return item.price.toFixed(2);
                                  })()}
                                  onFocus={(e) => {
                                    const key = `${item.type}-${item.id}`;
                                    setEditingPrices({ ...editingPrices, [key]: item.price.toString() });
                                    setTimeout(() => e.target.select(), 0);
                                  }}
                                  onChange={(e) => {
                                    const key = `${item.type}-${item.id}`;
                                    let v = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                                    const parts = v.split('.');
                                    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                                    setEditingPrices({ ...editingPrices, [key]: v });
                                  }}
                                  onBlur={() => {
                                    const key = `${item.type}-${item.id}`;
                                    const v = editingPrices[key] || '0';
                                    let num = parseFloat(v.replace(',', '.'));
                                    if (isNaN(num) || num < 0) num = 0;
                                    updatePrice(item.type, item.id, num);
                                    const next = { ...editingPrices };
                                    delete next[key];
                                    setEditingPrices(next);
                                  }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                  className="w-full px-1.5 py-1 bg-white border border-stone-200 rounded text-stone-900 text-xs text-right focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                />
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-amber-600">{formatCurrency(item.price * item.quantity)}</td>
                              <td className="py-2">
                                <button type="button" onClick={() => removeFromCart(item.type, item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
                      <div className="bg-stone-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-600">Subtotal</span>
                          <span className="font-medium text-stone-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div>
                          <label className="text-stone-600 text-xs font-medium">Desconto</label>
                          <div className="flex gap-1 mt-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={discountDisplay !== null ? discountDisplay : (discountValue === 0 ? '' : formatCurrencyInput(discountValue))}
                              onFocus={() => setDiscountDisplay(discountValue === 0 ? '' : formatCurrencyInput(discountValue))}
                              onChange={(e) => {
                                let raw = e.target.value.replace(/[^\d,]/g, '');
                                const parts = raw.split(',');
                                if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
                                setDiscountDisplay(raw);
                                setDiscountValue(Math.max(0, parseCurrencyInput(raw)));
                              }}
                              onBlur={(e) => {
                                const v = Math.max(0, parseCurrencyInput(e.target.value));
                                setDiscountValue(v);
                                setDiscountDisplay(null);
                              }}
                              placeholder="0,00"
                              className="flex-1 px-2 py-1.5 bg-white border border-stone-200 rounded text-stone-900 text-sm text-right focus:ring-2 focus:ring-amber-500/30"
                            />
                            <button type="button" onClick={() => setDiscountType('percent')} className={`px-2.5 py-1.5 text-xs font-semibold rounded ${discountType === 'percent' ? 'bg-stone-800 text-amber-400 border border-amber-600/50' : 'bg-white border border-stone-200 text-stone-600'}`}>%</button>
                            <button type="button" onClick={() => setDiscountType('value')} className={`px-2.5 py-1.5 text-xs font-semibold rounded ${discountType === 'value' ? 'bg-stone-800 text-amber-400 border border-amber-600/50' : 'bg-white border border-stone-200 text-stone-600'}`}>R$</button>
                          </div>
                          {discountAmount > 0 && <p className="text-right text-xs text-red-600 font-medium mt-1">- {formatCurrency(discountAmount)}</p>}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                          <span className="font-semibold text-stone-900">Total</span>
                          <span className="text-xl font-bold text-amber-600">{formatCurrency(total)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCheckoutModal(true)}
                        className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg font-semibold text-sm border border-amber-600/50 shadow-[0_0_0_1px_rgba(245,158,11,0.25)] hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-colors"
                      >
                        Finalizar venda
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Modal Adicionar Item ao Carrinho */}
      {showAddItemModal && itemToAdd && (
        <Modal
          isOpen={showAddItemModal}
          onClose={() => {
            setShowAddItemModal(false);
            setItemToAdd(null);
          }}
          title="Adicionar ao Carrinho"
          size="md"
          footer={
            <div className="flex flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddItemModal(false);
                  setItemToAdd(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={confirmAddToCart}>
                Adicionar
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
                    className="h-10 w-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 border border-gray-300"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setTempQuantity(Math.max(1, value));
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-center text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setTempQuantity(tempQuantity + 1)}
                    className="h-10 w-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 border border-gray-300"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {itemToAdd.stock !== undefined && (
                  <p className="text-xs text-gray-600 mt-2">
                    Estoque disponível: {itemToAdd.stock}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Unitário
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tempPriceDisplay !== null ? tempPriceDisplay : (tempPrice === 0 ? '' : formatCurrencyInput(tempPrice))}
                    onFocus={() => setTempPriceDisplay(tempPrice === 0 ? '' : formatCurrencyInput(tempPrice))}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^\d,]/g, '');
                      const parts = raw.split(',');
                      if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
                      setTempPriceDisplay(raw);
                      setTempPrice(Math.max(0, parseCurrencyInput(raw)));
                    }}
                    onBlur={(e) => {
                      const v = Math.max(0, parseCurrencyInput(e.target.value));
                      setTempPrice(v);
                      setTempPriceDisplay(null);
                    }}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(tempPrice * tempQuantity)}
                  </span>
                </div>
              </div>

          </div>
        </Modal>
      )}

      {/* Modal de Finalização */}
      {showCheckoutModal && (
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          title="Finalizar Venda"
          size="lg"
          footer={
            <div className="flex flex-row gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowCheckoutModal(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={finalizeSale}
                disabled={!resumo.contaFechada || pagamentos.length === 0}
              >
                Confirmar Venda
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
              {/* Cliente */}
              <div className="relative">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Cliente (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => customerSearchTerm.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Digite CPF, telefone ou nome"
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-900 bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') searchCustomer();
                      if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={searchCustomer}
                    className="px-4 py-2 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 hover:bg-amber-50 hover:border-amber-300 focus:ring-2 focus:ring-amber-500 transition-colors"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
                {showSuggestions && customerSuggestionsList.length > 0 && !selectedCustomer && (
                  <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg py-1">
                    {customerSuggestionsList.map((c: any) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectCustomerFromSuggestion(c); }}
                          className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-amber-50 focus:bg-amber-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                            {c.photo ? (
                              <Image src={c.photo} alt="" width={32} height={32} className="object-cover w-full h-full" />
                            ) : (
                              <User className="h-4 w-4 text-stone-500" />
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="text-sm font-medium text-stone-800 truncate">{c.name}</p>
                            <p className="text-xs text-stone-500">{c.phone}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedCustomer ? (
                  <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center">
                        {selectedCustomer.photo ? (
                          <Image src={selectedCustomer.photo} alt={selectedCustomer.name} fill className="object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-stone-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{selectedCustomer.name}</p>
                        <p className="text-xs text-stone-600">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer(null); setCheckoutData({ ...checkoutData, customerId: '' }); }}
                      className="p-1.5 rounded text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors flex-shrink-0"
                      title="Remover cliente"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 mt-1">Venda sem cliente se não buscar.</p>
                )}
              </div>

              {/* Profissional */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Profissional *</label>
                <select
                  value={checkoutData.professional}
                  onChange={(e) => setCheckoutData({ ...checkoutData, professional: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-900 bg-white"
                  required
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.name}>{prof.name}</option>
                  ))}
                </select>
                {professionals.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhum profissional ativo. <a href="/admin/profissionais" className="underline font-medium">Cadastre aqui</a>
                  </p>
                )}
              </div>

              {/* Card: Formas de pagamento (lógica useVendaCompleta) */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold text-stone-800">Total a receber</h3>
                  <span className="text-xl font-bold text-amber-600">{formatCurrency(total)}</span>
                </div>

                {/* Lista do que já foi lançado */}
                <div className="space-y-2">
                  {pagamentos.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2 border-b border-stone-200">
                      <div className="flex items-center gap-2 font-medium text-stone-800">
                        {p.metodo === 'CARTAO_CREDITO' ? <CreditCard className="h-4 w-4 text-stone-500" /> : <Banknote className="h-4 w-4 text-stone-500" />}
                        <span>{p.metodo === 'CARTAO_CREDITO' ? 'Crédito' : p.metodo === 'CARTAO_DEBITO' ? 'Débito' : p.metodo}</span>
                        {p.parcelas && p.parcelas > 1 && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{p.parcelas}x</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-stone-700">R$ {p.valor.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removerPagamento(p.id)}
                          className="p-1.5 rounded text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {pagamentos.length === 0 && (
                    <p className="text-stone-400 text-center text-sm py-3">Nenhum pagamento lançado.</p>
                  )}
                </div>

                {/* Área de lançamento (só aparece se faltar receber) */}
                {!resumo.contaFechada ? (
                  <div className="bg-amber-50/80 p-4 rounded-lg border border-amber-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-amber-800 uppercase">Falta receber</span>
                      <span className="text-sm font-bold text-amber-700">R$ {Math.max(0, resumo.restante).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={metodoTemp}
                        onChange={(e) => setMetodoTemp(e.target.value as MetodoPagamento)}
                        className="w-full px-2 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      >
                        <option value="PIX">PIX</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="CARTAO_CREDITO">Crédito</option>
                        <option value="CARTAO_DEBITO">Débito</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-stone-600">R$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={valorTempDisplay !== null ? valorTempDisplay : valorTemp}
                          onFocus={() => setValorTempDisplay(valorTemp || (resumo.restante > 0 ? formatCurrencyInput(resumo.restante) : ''))}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/[^\d,]/g, '');
                            const parts = raw.split(',');
                            if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
                            setValorTempDisplay(raw);
                            setValorTemp(raw);
                          }}
                          onBlur={(e) => {
                            const v = parseCurrencyInput(e.target.value);
                            setValorTemp(v > 0 ? formatCurrencyInput(v) : '');
                            setValorTempDisplay(null);
                          }}
                          placeholder={resumo.restante > 0 ? formatCurrencyInput(resumo.restante) : '0,00'}
                          className="flex-1 w-24 px-2 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-right bg-white"
                        />
                      </div>
                    </div>
                    {metodoTemp === 'CARTAO_CREDITO' && (
                      <select
                        value={parcelasTemp}
                        onChange={(e) => setParcelasTemp(Number(e.target.value))}
                        className="w-full px-2 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <option key={n} value={n}>{n === 1 ? 'À vista (1x)' : `${n}x`}</option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const raw = valorTempDisplay ?? valorTemp;
                        const valorReal = raw ? parseCurrencyInput(raw) : Math.max(0, resumo.restante);
                        if (valorReal <= 0) return;
                        adicionarPagamento({
                          metodo: metodoTemp,
                          valor: valorReal,
                          parcelas: metodoTemp === 'CARTAO_CREDITO' ? parcelasTemp : undefined,
                        });
                        setValorTemp('');
                        setValorTempDisplay(null);
                        setParcelasTemp(1);
                      }}
                      className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg font-medium flex items-center justify-center gap-2 border border-amber-600/50 shadow-[0_0_0_1px_rgba(245,158,11,0.25)] hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-colors"
                    >
                      <Plus className="h-5 w-5" /> Lançar pagamento
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-100 text-green-800 py-3 px-4 rounded-lg text-center font-semibold">
                    ✓ Conta fechada!
                  </div>
                )}
              </div>

              {/* Resumo */}
              <div className="pt-3 border-t border-stone-200">
                <div className="flex justify-between items-center text-sm text-stone-600 mb-1">
                  <span>Itens</span>
                  <span>{cart.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-stone-800">Total da venda</span>
                  <span className="text-xl font-bold text-amber-600">{formatCurrency(total)}</span>
                </div>
              </div>
          </div>
        </Modal>
      )}

      {/* Modal - Cliente Não Encontrado */}
      {showCustomerNotFoundModal && (
        <Modal
          isOpen={showCustomerNotFoundModal}
          onClose={() => {
            setShowCustomerNotFoundModal(false);
            setCustomerSearchTerm('');
          }}
          title="Cliente Não Encontrado"
          size="md"
          footer={
            <div className="flex flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCustomerNotFoundModal(false);
                  setCustomerSearchTerm('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setShowCustomerNotFoundModal(false);
                  setShowNewCustomerModal(true);
                  setNewCustomerData({ ...newCustomerData, phone: customerSearchTerm });
                }}
              >
                Cadastrar Cliente
              </Button>
            </div>
          }
        >
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-medium text-lg mb-2">
              ⚠️ Cliente não localizado
            </p>
            <p className="text-yellow-700">
              Deseja cadastrar um novo cliente com essas informações?
            </p>
            {customerSearchTerm && (
              <p className="text-yellow-600 text-sm mt-3 font-mono bg-yellow-100 px-3 py-2 rounded border border-yellow-300">
                Busca: {customerSearchTerm}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Modal - Cadastro de Novo Cliente */}
      {showNewCustomerModal && (
        <Modal
          isOpen={showNewCustomerModal}
          onClose={() => {
            setShowNewCustomerModal(false);
            setNewCustomerData({ name: '', email: '', phone: '', cpf: '', birthday: '', notes: '', photo: '' });
            setPhotoPreview(null);
          }}
          title="Cadastrar Novo Cliente"
          size="md"
          footer={
            <div className="flex flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowNewCustomerModal(false);
                  setNewCustomerData({ name: '', email: '', phone: '', cpf: '', birthday: '', notes: '', photo: '' });
                  setPhotoPreview(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" form="new-customer-form" variant="primary">
                Cadastrar
              </Button>
            </div>
          }
        >
          <form id="new-customer-form" onSubmit={(e) => { e.preventDefault(); handleRegisterNewCustomer(); }} className="space-y-4">
            {/* Upload de Foto */}
            <div className="w-full pb-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Cliente</label>
              <div className="w-full rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                {photoPreview ? (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={photoPreview}
                      alt="Foto do cliente"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow"
                      title="Remover foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="photo-upload-pdv"
                    className={`flex flex-col items-center justify-center w-full aspect-video cursor-pointer transition-colors ${
                      uploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Camera className="h-10 w-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">{uploading ? 'Enviando...' : 'Clique para adicionar foto'}</span>
                  </label>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload-pdv"
              />
              {photoPreview && (
                <label
                  htmlFor="photo-upload-pdv"
                  className="mt-2 flex w-full justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {uploading ? 'Enviando...' : 'Trocar foto'}
                </label>
              )}
              <p className="text-xs text-gray-500 mt-1.5">JPG, PNG ou WEBP (máx. 5MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  required
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  required
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.cpf}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  type="email"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.birthday}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, birthday: e.target.value })}
                  type="date"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.notes}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
                  rows={3}
                  placeholder="Ex: Cliente VIP, prefere horários pela manhã..."
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
