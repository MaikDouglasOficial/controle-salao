import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './useToast';
import type { 
  Customer, 
  ClienteFormData, 
  Professional, 
  ProfissionalFormData,
  Service,
  ServicoFormData,
  Product,
  ProdutoFormData,
  Agendamento,
  AgendamentoFormData,
  Expense,
  DespesaFormData
} from '@/types';

// ===== CLIENTES =====
export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      return response.json();
    },
  });
}

export function useCustomer(id: string) {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: async () => {
      const response = await fetch(`/api/customers?id=${id}`);
      if (!response.ok) throw new Error('Erro ao buscar cliente');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success('Cliente cadastrado com sucesso');
    },
    onError: () => {
      error('Erro ao cadastrar cliente');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClienteFormData }) => {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(id), ...data }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar cliente');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
      success('Cliente atualizado com sucesso');
    },
    onError: () => {
      error('Erro ao atualizar cliente');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customers?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success('Cliente excluído com sucesso');
    },
    onError: () => {
      error('Erro ao excluir cliente');
    },
  });
}

// ===== PRODUTOS =====
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return response.json();
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await fetch(`/api/products?id=${id}`);
      if (!response.ok) throw new Error('Erro ao buscar produto');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir produto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Produto excluído com sucesso');
    },
    onError: () => {
      error('Erro ao excluir produto');
    },
  });
}

// ===== SERVIÇOS =====
export function useServices() {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Erro ao buscar serviços');
      return response.json();
    },
  });
}

export function useService(id: string) {
  return useQuery<Service>({
    queryKey: ['services', id],
    queryFn: async () => {
      const response = await fetch(`/api/services?id=${id}`);
      if (!response.ok) throw new Error('Erro ao buscar serviço');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/services?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir serviço');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      success('Serviço excluído com sucesso');
    },
    onError: () => {
      error('Erro ao excluir serviço');
    },
  });
}

// ===== PROFISSIONAIS =====
export function useProfessionals() {
  return useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const response = await fetch('/api/professionals');
      if (!response.ok) throw new Error('Erro ao buscar profissionais');
      return response.json();
    },
  });
}

export function useProfessional(id: string) {
  return useQuery<Professional>({
    queryKey: ['professionals', id],
    queryFn: async () => {
      const response = await fetch(`/api/professionals?id=${id}`);
      if (!response.ok) throw new Error('Erro ao buscar profissional');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/professionals?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir profissional');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      success('Profissional excluído com sucesso');
    },
    onError: () => {
      error('Erro ao excluir profissional');
    },
  });
}

// ===== DESPESAS =====
export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Erro ao buscar despesas');
      return response.json();
    },
  });
}

export function useExpense(id: string) {
  return useQuery<Expense>({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?id=${id}`);
      if (!response.ok) throw new Error('Erro ao buscar despesa');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir despesa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success('Despesa excluída com sucesso');
    },
    onError: () => {
      error('Erro ao excluir despesa');
    },
  });
}

// ===== DASHBOARD =====
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    },
    // Refetch a cada 30 segundos para dashboard
    refetchInterval: 1000 * 30,
  });
}
