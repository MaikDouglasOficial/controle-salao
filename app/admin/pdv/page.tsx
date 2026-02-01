'use client';

import { useEffect, useState, useRef } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, User, Package, Camera, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  photo?: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
}

interface CartItem {
  type: 'product' | 'service';
  id: number;
  name: string;
  price: number;
  quantity: number;
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
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCustomerNotFoundModal, setShowCustomerNotFoundModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState({
    customerId: '',
    professional: '',
    paymentMethod: 'DINHEIRO',
    installments: 1,
    installmentValue: 0,
  });
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
  const [itemToAdd, setItemToAdd] = useState<{type: 'product' | 'service', id: number, name: string, price: number, stock?: number} | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [editingPrices, setEditingPrices] = useState<{[key: string]: string}>({});
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      const [productsRes, servicesRes, customersRes, professionalsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/services'),
        fetch('/api/customers'),
        fetch('/api/professionals'),
      ]);
      
      const productsData = await productsRes.json();
      const servicesData = await servicesRes.json();
      const customersData = await customersRes.json();
      const professionalsData = await professionalsRes.json();
      
      setProducts(productsData);
      setServices(servicesData);
      setCustomers(customersData);
      // Filtrar apenas profissionais ativos
      setProfessionals(professionalsData.filter((p: Professional) => p.active));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddItemModal = (item: { type: 'product' | 'service'; id: number; name: string; price: number; stock?: number }) => {
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
      setCart([...cart, { type: itemToAdd.type, id: itemToAdd.id, name: itemToAdd.name, price: tempPrice, quantity: tempQuantity }]);
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

  const finalizeSale = async () => {
    if (cart.length === 0) {
      error('Carrinho vazio!');
      return;
    }

    if (!checkoutData.paymentMethod) {
      error('Por favor, selecione a forma de pagamento!');
      return;
    }

    if (!checkoutData.professional || checkoutData.professional.trim() === '') {
      error('Por favor, informe o profissional que realizou o atendimento!');
      return;
    }

    try {
      const saleData: any = {
        customerId: checkoutData.customerId ? parseInt(checkoutData.customerId) : null,
        professional: checkoutData.professional,
        paymentMethod: checkoutData.paymentMethod,
        total: total,
        items: cart.map(item => ({
          type: item.type,
          productId: item.type === 'product' ? item.id : null,
          serviceId: item.type === 'service' ? item.id : null,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // Adicionar dados de parcelamento se for cartão de crédito
      if (checkoutData.paymentMethod === 'CARTAO_CREDITO') {
        saleData.installments = checkoutData.installments;
        saleData.installmentValue = checkoutData.installmentValue;
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        success('Venda finalizada com sucesso!');
        setCart([]);
        setShowCheckoutModal(false);
        setCheckoutData({ customerId: '', professional: '', paymentMethod: 'DINHEIRO', installments: 1, installmentValue: 0 });
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

  const searchCustomer = () => {
    const term = customerSearchTerm.trim();
    if (!term) {
      error('Digite o CPF, telefone ou nome do cliente para buscar');
      return;
    }

    // Remove formatação para busca
    const cleanTerm = term.replace(/[^\w\s]/g, '').toLowerCase();
    
    // Prioridade 1: Busca por CPF (11 ou 14 dígitos)
    if (/^\d{11,14}$/.test(cleanTerm)) {
      const found = customers.find((c: any) => 
        c.cpf?.replace(/[^\d]/g, '') === cleanTerm
      );
      
      if (found) {
        setSelectedCustomer(found);
        setCheckoutData({ ...checkoutData, customerId: found.id.toString() });
        setCustomerSearchTerm('');
        return;
      }
    }

    // Prioridade 2: Busca por Telefone (10 ou 11 dígitos)
    if (/^\d{10,11}$/.test(cleanTerm)) {
      const found = customers.find((c: any) => 
        c.phone?.replace(/[^\d]/g, '').includes(cleanTerm)
      );
      
      if (found) {
        setSelectedCustomer(found);
        setCheckoutData({ ...checkoutData, customerId: found.id.toString() });
        setCustomerSearchTerm('');
        return;
      }
    }

    // Prioridade 3: Busca por Nome
    const found = customers.find((c: any) =>
      c.name.toLowerCase().includes(term.toLowerCase())
    );

    if (found) {
      setSelectedCustomer(found);
      setCheckoutData({ ...checkoutData, customerId: found.id.toString() });
      setCustomerSearchTerm('');
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

      const response = await fetch('/api/upload', {
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
      const response = await fetch('/api/customers', {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Minimalista */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              PDV - Ponto de Venda
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sistema de vendas
            </p>
          </div>
        </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produtos e serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área de Produtos e Serviços - Ocupa 2 de 3 colunas */}
        <div className="lg:col-span-2 space-y-6">

            {/* Produtos e Serviços em Linha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Produtos */}
              <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Produtos
                </h2>
                <span className="text-sm text-gray-500 font-medium">{filteredProducts.length} itens</span>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => openAddItemModal({ type: 'product', id: product.id, name: product.name, price: product.price, stock: product.stock })}
                      className="group relative border-2 border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                          {product.photo ? (
                            <Image
                              src={product.photo}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              product.stock > 10 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : product.stock > 0 
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              Estoque: {product.stock}
                            </span>
                            <span className="text-base font-bold text-blue-600">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Serviços */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Serviços
                </h2>
                <span className="text-sm text-gray-500 font-medium">{filteredServices.length} itens</span>
              </div>
              
              {filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="h-16 w-16 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">Nenhum serviço encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => openAddItemModal({ type: 'service', id: service.id, name: service.name, price: service.price })}
                      className="group relative border-2 border-gray-200 rounded-lg p-3 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 text-left hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-purple-200">
                          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{service.name}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">Serviço</span>
                            <span className="text-base font-bold text-purple-600">
                              {formatCurrency(service.price)}
                            </span>
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Carrinho - Estilo Tabela - Ocupa 1 de 3 colunas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg sticky top-4 overflow-hidden">
              {/* Header do Carrinho */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-6 w-6 text-white" />
                  <h2 className="text-lg font-bold text-white">Carrinho ({cart.length})</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-white hover:text-blue-100 underline font-medium"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Tabela de Itens */}
              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Carrinho vazio</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr className="border-b-2 border-gray-200">
                            <th className="px-3 py-2 text-left text-gray-700 font-semibold">Produto</th>
                            <th className="px-2 py-2 text-center text-gray-700 font-semibold w-20">Qtd</th>
                            <th className="px-2 py-2 text-right text-gray-700 font-semibold w-24">Unit.</th>
                            <th className="px-2 py-2 text-right text-gray-700 font-semibold w-24">Total</th>
                            <th className="px-2 py-2 text-center text-gray-700 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cart.map((item, index) => (
                            <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3">
                                <div>
                                  <p className="text-gray-900 font-medium line-clamp-2">{item.name}</p>
                                  <p className="text-gray-500 text-xs mt-0.5">
                                    {item.type === 'product' ? '📦 Produto' : '✨ Serviço'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-2 py-3">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => updateQuantity(item.type, item.id, -1)}
                                    className="h-6 w-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-gray-900 font-semibold min-w-[24px] text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.type, item.id, 1)}
                                    className="h-6 w-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-1 py-3">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={(() => {
                                    const key = `${item.type}-${item.id}`;
                                    if (editingPrices[key] !== undefined) {
                                      return editingPrices[key];
                                    }
                                    return item.price.toFixed(2);
                                  })()}
                                  onFocus={(e) => {
                                    const key = `${item.type}-${item.id}`;
                                    const currentValue = item.price.toString();
                                    setEditingPrices({...editingPrices, [key]: currentValue});
                                    setTimeout(() => e.target.select(), 0);
                                  }}
                                  onChange={(e) => {
                                    const key = `${item.type}-${item.id}`;
                                    let value = e.target.value;
                                    
                                    // Permite apenas números, vírgula e ponto
                                    value = value.replace(/[^\d.,]/g, '');
                                    
                                    // Substitui vírgula por ponto
                                    value = value.replace(',', '.');
                                    
                                    // Permite apenas um ponto decimal
                                    const parts = value.split('.');
                                    if (parts.length > 2) {
                                      value = parts[0] + '.' + parts.slice(1).join('');
                                    }
                                    
                                    setEditingPrices({...editingPrices, [key]: value});
                                  }}
                                  onBlur={() => {
                                    const key = `${item.type}-${item.id}`;
                                    const value = editingPrices[key] || '0';
                                    const cleanValue = value.replace(',', '.');
                                    
                                    let numValue = parseFloat(cleanValue);
                                    if (isNaN(numValue) || numValue < 0) {
                                      numValue = 0;
                                    }
                                    
                                    updatePrice(item.type, item.id, numValue);
                                    
                                    // Remove do estado de edição
                                    const newEditingPrices = {...editingPrices};
                                    delete newEditingPrices[key];
                                    setEditingPrices(newEditingPrices);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-xs text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="px-2 py-3 text-right">
                                <span className="text-blue-600 font-bold">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <button
                                  onClick={() => removeFromCart(item.type, item.id)}
                                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total e Botão */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-4">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 space-y-3 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 text-sm font-medium">Subtotal</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(subtotal)}</span>
                        </div>
                        
                        {/* Campo de Desconto */}
                        <div className="space-y-2">
                          <label className="text-gray-700 text-sm font-medium">Desconto</label>
                          <div className="flex gap-2">
                            <div className="flex-1 flex gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={discountValue || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                                  setDiscountValue(parseFloat(value) || 0);
                                }}
                                placeholder="0"
                                className="flex-1 px-2 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() => setDiscountType('percent')}
                                className={`px-3 py-2 text-sm font-bold rounded transition-all ${
                                  discountType === 'percent'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                %
                              </button>
                              <button
                                onClick={() => setDiscountType('value')}
                                className={`px-3 py-2 text-sm font-bold rounded transition-all ${
                                  discountType === 'value'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                R$
                              </button>
                            </div>
                          </div>
                          {discountAmount > 0 && (
                            <div className="text-right text-sm text-red-600 font-medium">
                              - {formatCurrency(discountAmount)}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                          <span className="text-xl font-bold text-gray-900">TOTAL</span>
                          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowCheckoutModal(true)}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-bold text-base"
                      >
                        🛒 FINALIZAR VENDA
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
          subtitle={itemToAdd.name}
          size="md"
          footer={
            <>
              <Button 
                variant="secondary"
                onClick={() => {
                  setShowAddItemModal(false);
                  setItemToAdd(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmAddToCart}
              >
                Adicionar
              </Button>
            </>
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
                    value={tempPrice === 0 ? '' : tempPrice.toString().replace('.', ',')}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                      setTempPrice(parseFloat(value) || 0);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace(',', '.');
                      const numValue = parseFloat(value) || 0;
                      setTempPrice(numValue);
                    }}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
          subtitle="Selecione o cliente e configure os detalhes da venda"
          size="lg"
          footer={
            <>
              <Button 
                variant="secondary" 
                onClick={() => setShowCheckoutModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={finalizeSale}
              >
                Confirmar Venda
              </Button>
            </>
          }
        >
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Cliente por CPF, Telefone ou Nome <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    placeholder="Digite CPF, telefone ou nome"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchCustomer();
                      }
                    }}
                  />
                  <button
                    onClick={searchCustomer}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>

                {/* Cliente Selecionado */}
                {selectedCustomer && (
                  <div className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {selectedCustomer.photo ? (
                            <Image
                              src={selectedCustomer.photo}
                              alt={selectedCustomer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cliente Selecionado:</p>
                          <p className="text-lg font-bold text-green-900 mt-1">{selectedCustomer.name}</p>
                          <p className="text-sm text-green-800 mt-0.5">{selectedCustomer.phone}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCheckoutData({ ...checkoutData, customerId: '' });
                        }}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                      >
                        <span className="text-xl text-green-700">×</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissional *
                </label>
                <select
                  value={checkoutData.professional}
                  onChange={(e) => setCheckoutData({ ...checkoutData, professional: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 bg-white"
                  required
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.name}>
                      {prof.name}
                    </option>
                  ))}
                </select>
                {professionals.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhum profissional ativo cadastrado. <a href="/admin/profissionais" className="underline font-medium">Cadastre aqui</a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento *
                </label>
                <select
                  value={checkoutData.paymentMethod}
                  onChange={(e) => {
                    const newPaymentMethod = e.target.value;
                    setCheckoutData({ 
                      ...checkoutData, 
                      paymentMethod: newPaymentMethod,
                      installments: newPaymentMethod === 'CARTAO_CREDITO' ? 1 : 1,
                      installmentValue: newPaymentMethod === 'CARTAO_CREDITO' ? total : 0,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>

              {/* Campos de Parcelamento - Apenas para Cartão de Crédito */}
              {checkoutData.paymentMethod === 'CARTAO_CREDITO' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Parcelas *
                    </label>
                    <select
                      value={checkoutData.installments}
                      onChange={(e) => {
                        const installments = parseInt(e.target.value);
                        setCheckoutData({ 
                          ...checkoutData, 
                          installments,
                          installmentValue: total / installments,
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <option key={num} value={num}>
                          {num}x de R$ {(total / num).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Parcelamento: {checkoutData.installments}x de R$ {checkoutData.installmentValue.toFixed(2)}
                    </p>
                  </div>
                </>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Itens</span>
                  <span className="font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(total)}
                  </span>
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
          subtitle="O cliente não foi localizado no sistema"
          size="md"
          footer={
            <div className="modal-actions flex flex-row gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowCustomerNotFoundModal(false);
                  setCustomerSearchTerm('');
                }}
              >
                Cancelar
              </Button>
              <Button 
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
          subtitle="Preencha os dados para cadastrar um novo cliente"
          size="md"
          footer={
            <div className="modal-actions flex flex-row gap-3 justify-end">
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => {
                  setShowNewCustomerModal(false);
                  setNewCustomerData({ name: '', email: '', phone: '', cpf: '', birthday: '', notes: '', photo: '' });
                  setPhotoPreview(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="new-customer-form"
              >
                Cadastrar
              </Button>
            </div>
          }
        >
          <form id="new-customer-form" onSubmit={(e) => { e.preventDefault(); handleRegisterNewCustomer(); }} className="space-y-4">
            {/* Upload de Foto */}
            <div className="flex flex-col items-center space-y-3 pb-4 border-b">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary-100">
                    <Image
                      src={photoPreview}
                      alt="Foto do cliente"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remover foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
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
              <label
                htmlFor="photo-upload-pdv"
                className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {uploading ? 'Enviando...' : photoPreview ? 'Trocar Foto' : 'Adicionar Foto'}
              </label>
              <p className="text-xs text-gray-500">JPG, PNG ou WEBP (máx. 5MB)</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newCustomerData.cpf}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
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
    </div>
  );
}
