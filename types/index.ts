// Tipos principais do sistema

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';
  createdAt: Date;
  updatedAt: Date;
}

// Tipos principais em inglês (compatível com frontend)
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birthday?: string;
  address?: string;
  notes?: string;
  photo?: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastVisit?: Date | string;
  totalSpent?: number;
  totalVisits?: number;
}

// Alias para compatibilidade
export type Cliente = Customer;

export interface Professional {
  id: number;
  name: string;
  phone: string;
  email?: string;
  specialty?: string;
  commission: number;
  photo?: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Alias para compatibilidade
export type Profissional = Professional;

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Alias para compatibilidade
export type Servico = Service;

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  sku?: string;
  photo?: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Alias para compatibilidade
export type Produto = Product;

export interface Agendamento {
  id: string;
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  dataHora: Date;
  status: 'AGENDADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO';
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  cliente?: Cliente;
  profissional?: Profissional;
  servico?: Servico;
}

export interface Expense {
  id: number;
  name: string;
  category: string;
  value: number;
  type: string;
  date: string | Date;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Alias para compatibilidade
export type Despesa = Expense;

export interface Venda {
  id: string;
  clienteId?: string;
  profissionalId?: string;
  produtos: ItemVenda[];
  servicos: ItemVenda[];
  subtotal: number;
  desconto: number;
  total: number;
  metodoPagamento: 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'OUTRO';
  status: 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  cliente?: Cliente;
  profissional?: Profissional;
}

export interface ItemVenda {
  id: string;
  vendaId: string;
  tipo: 'PRODUTO' | 'SERVICO';
  itemId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

// Tipos para APIs
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos para formulários
export interface ClienteFormData {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  dataNascimento?: string;
  endereco?: string;
  observacoes?: string;
}

export interface ProfissionalFormData {
  nome: string;
  telefone: string;
  email?: string;
  especialidade?: string;
  comissao: number;
}

export interface ServicoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number;
}

export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
}

export interface AgendamentoFormData {
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  dataHora: string;
  observacoes?: string;
}

export interface DespesaFormData {
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  observacoes?: string;
}

// Tipos para Dashboard
export interface DashboardStats {
  receitaDia: number;
  receitaMes: number;
  agendamentosDia: number;
  agendamentosMes: number;
  clientesAtivos: number;
  produtosEstoqueBaixo: number;
  crescimentoMensal: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// Tipos para modais
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}
