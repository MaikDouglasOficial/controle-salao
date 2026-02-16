'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  Clock,
  Scissors,
  Phone,
  ArrowRight,
  User,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  PageContainer, 
  PageHeader, 
  Card, 
  CardHeader, 
  CardBody,
  Alert,
  Badge,
  getStatusBadgeVariant,
  formatStatusText,
  LoadingSpinner,
  EmptyState,
  Button
} from '@/components/ui';

interface DashboardStats {
  lucroDia: number;
  lucroMes: number;
  lucroAno: number;
  despesasMes: number;
  lucroLiquido: number;
  clientesTotal: number;
  agendamentosHoje: number;
  atendimentosHoje: number;
  atendimentosMes: number;
  produtosEstoqueBaixo: number;
}

interface Agendamento {
  id: number;
  customer: { name: string; phone: string; photo?: string };
  service: { name: string; price: number; duration: number };
  date: string;
  time: string;
  status: string;
  professional: string | null;
}

interface Aniversariante {
  id: number;
  name: string;
  phone: string;
  birthday: string;
  photo?: string;
}

interface VendaRecente {
  id: number;
  customer: { name: string; phone: string; photo?: string } | null;
  professional: string | null;
  total: number;
  paymentMethod: string;
  date: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    product?: { name: string } | null;
    service?: { name: string } | null;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    lucroDia: 0,
    lucroMes: 0,
    lucroAno: 0,
    despesasMes: 0,
    lucroLiquido: 0,
    clientesTotal: 0,
    agendamentosHoje: 0,
    atendimentosHoje: 0,
    atendimentosMes: 0,
    produtosEstoqueBaixo: 0,
  });
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([]);
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Dashboard Frontend - Iniciando busca de dados...');
        
        const [dashboardResponse, chartResponse] = await Promise.all([
          fetch('/api/dashboard', { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch('/api/dashboard/charts', { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
        ]);

        console.log('Dashboard Frontend - Respostas recebidas:', {
          dashboardOk: dashboardResponse.ok,
          chartOk: chartResponse.ok
        });

        if (!dashboardResponse.ok || !chartResponse.ok) {
          throw new Error('Falha ao buscar dados do dashboard');
        }

        const dashboardData = await dashboardResponse.json();
        const chartData = await chartResponse.json();

        console.log('Dashboard Frontend - Dados processados:', {
          stats: dashboardData.stats,
          proximosAgendamentos: dashboardData.proximosAgendamentos?.length || 0,
          aniversariantes: dashboardData.aniversariantes?.length || 0,
          chartData: chartData?.length || 0
        });

        setStats(dashboardData.stats);
        setProximosAgendamentos(dashboardData.proximosAgendamentos || []);
        setAniversariantes(dashboardData.aniversariantes || []);
        setVendasRecentes(dashboardData.vendasRecentes || []);
        setChartData(chartData);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cards = [
    {
      title: 'Lucro do Dia',
      value: formatCurrency(stats?.lucroDia || 0),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-600',
    },
    {
      title: 'Lucro do Mês',
      value: formatCurrency(stats?.lucroMes || 0),
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600',
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(stats?.lucroLiquido || 0),
      icon: DollarSign,
      color: 'from-blue-500 to-blue-700',
      textColor: 'text-blue-600',
    },
    {
      title: 'Clientes',
      value: (stats?.clientesTotal || 0).toString(),
      icon: Users,
      color: 'from-orange-500 to-red-600',
      textColor: 'text-orange-600',
    },
    {
      title: 'Atendimentos Hoje',
      value: (stats?.atendimentosHoje || 0).toString(),
      icon: Scissors,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
    },
    {
      title: 'Atendimentos do Mês',
      value: (stats?.atendimentosMes || 0).toString(),
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600',
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do seu salão</p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="card">
                <CardBody className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-500 mb-1 truncate font-medium">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-stone-900 truncate tracking-tight">
                        {card.value}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-100">
                      <Icon className="h-6 w-6 text-amber-600" strokeWidth={2} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Alertas */}
        {stats && stats.produtosEstoqueBaixo > 0 && (
          <Alert 
            variant="warning" 
            title="Estoque Baixo"
            className="bg-amber-50 border-amber-200 rounded-xl"
          >
            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-amber-600" />
              <span className="text-amber-800">
                {stats.produtosEstoqueBaixo} produto(s) com estoque baixo. 
                <button 
                  onClick={() => router.push('/admin/produtos')}
                  className="ml-2 text-amber-700 underline hover:text-amber-900"
                >
                  Verificar produtos
                </button>
              </span>
            </div>
          </Alert>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <Card className="card">
            <CardHeader title="Receita x Despesas" subtitle="Últimos meses" className="pb-2" />
            <CardBody className="pt-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e7e5e4',
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px rgba(28, 25, 23, 0.08)'
                    }}
                  />
                  <Bar dataKey="receita" fill="#b45309" name="Receita" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesa" fill="#78716c" name="Despesa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card className="card">
            <CardHeader title="Resumo financeiro" subtitle="Este mês" className="pb-2" />
            <CardBody className="pt-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 px-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-stone-700 font-medium">Receita Total (Mês)</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">
                    {formatCurrency(stats?.lucroMes || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-stone-500" />
                    <span className="text-sm text-stone-700 font-medium">Despesas (Mês)</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">
                    {formatCurrency(stats?.despesasMes || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-stone-900">Lucro Líquido</span>
                  </div>
                  <span className="text-base font-bold text-stone-900">
                    {formatCurrency(stats?.lucroLiquido || 0)}
                  </span>
                </div>

                <div className="pt-3 space-y-3 border-t border-stone-100">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-stone-500" />
                      <span className="text-sm text-stone-600">Agendamentos hoje</span>
                    </div>
                    <span className="text-sm font-medium text-stone-900">{stats?.agendamentosHoje || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-stone-500" />
                      <span className="text-sm text-stone-600">Total de clientes</span>
                    </div>
                    <span className="text-sm font-medium text-stone-900">{stats?.clientesTotal || 0}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Próximos Agendamentos */}
        <Card className="card">
          <CardHeader title="Próximos agendamentos" subtitle="Hoje e em breve" className="border-b border-stone-100">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              onClick={() => router.push('/admin/agendamentos')}
            >
              Ver todos
            </Button>
          </CardHeader>
        
        <CardBody>
          {proximosAgendamentos.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8 text-stone-400" />}
              title="Nenhum agendamento"
              description="Crie um novo agendamento para começar"
              action={
                <Button
                  variant="primary"
                  onClick={() => router.push('/admin/agendamentos')}
                >
                  Criar agendamento
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {proximosAgendamentos.map((agendamento) => (
                <div
                  key={agendamento.id}
                  onClick={() => router.push('/admin/agendamentos')}
                  className="p-4 bg-stone-50 rounded-xl border border-stone-200 hover:bg-amber-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative bg-stone-200">
                          {agendamento.customer.photo ? (
                            <Image
                              src={agendamento.customer.photo}
                              alt={agendamento.customer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-stone-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-stone-900">
                            {agendamento.customer.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-xs text-stone-500 mt-0.5">
                            <Phone className="h-3 w-3" />
                            <span>{agendamento.customer.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center space-x-2 text-stone-600">
                          <Scissors className="h-3 w-3" />
                          <span>{agendamento.service.name} • {agendamento.service.duration}min</span>
                        </div>
                        <div className="flex items-center space-x-2 text-stone-600">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(agendamento.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {agendamento.time}
                          </span>
                        </div>
                        {agendamento.professional && (
                          <div className="flex items-center space-x-2 text-stone-600">
                            <Users className="h-3 w-3" />
                            <span>{agendamento.professional}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(agendamento.status)}>
                        {formatStatusText(agendamento.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

        {/* Aniversariantes do Mês */}
        <Card className="card">
          <CardHeader title="Aniversariantes do mês" subtitle="Parabenize seus clientes" className="border-b border-stone-100" />
          <CardBody>
          {aniversariantes.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8 text-stone-400" />}
              title="Nenhum aniversariante"
              description="Não há clientes fazendo aniversário este mês"
            />
          ) : (
            <div className="space-y-3">
              {aniversariantes.map((aniversariante) => {
                const birthday = new Date(aniversariante.birthday);
                const today = new Date();
                const isToday = birthday.getDate() === today.getDate() && 
                               birthday.getMonth() === today.getMonth();
                
                return (
                  <div
                    key={aniversariante.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      isToday ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-stone-200 flex items-center justify-center flex-shrink-0">
                          {aniversariante.photo ? (
                            <Image
                              src={aniversariante.photo}
                              alt={aniversariante.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-stone-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-stone-900">
                            {aniversariante.name}
                            {isToday && <span className="ml-2 text-xs text-amber-600">(Hoje)</span>}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-stone-500">
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{aniversariante.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {birthday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={isToday ? "primary" : "secondary"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const message = isToday 
                            ? `Parabéns pelo seu aniversário! Que tal comemorar com um cuidado especial no nosso salão? Temos uma surpresa para você!`
                            : `Olá ${aniversariante.name}! Seu aniversário está chegando. Que tal agendar um cuidado especial conosco?`;
                          const whatsappUrl = `https://wa.me/${aniversariante.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                      >
                        {isToday ? 'Parabenizar' : 'Lembrar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
        </Card>

        {/* Vendas Recentes */}
        <Card className="card">
          <CardHeader title="Vendas recentes" subtitle="Últimas vendas" className="border-b border-stone-100">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              onClick={() => router.push('/admin/vendas')}
            >
              Ver todos
            </Button>
          </CardHeader>

        <CardBody>
          {vendasRecentes.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-8 w-8 text-stone-400" />}
              title="Nenhuma venda"
              description="Realize uma venda no PDV para começar"
              action={
                <Button
                  variant="primary"
                  onClick={() => router.push('/admin/pdv')}
                >
                  Ir para PDV
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {vendasRecentes.map((venda) => {
                const paymentMethodLabels: { [key: string]: string } = {
                  'DINHEIRO': 'Dinheiro',
                  'CARTAO_CREDITO': 'Cartão de Crédito',
                  'CARTAO_DEBITO': 'Cartão de Débito',
                  'PIX': 'PIX'
                };

                return (
                  <div
                    key={venda.id}
                    onClick={() => router.push('/admin/vendas')}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 hover:bg-amber-50/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative bg-stone-200">
                            {venda.customer?.photo ? (
                              <Image
                                src={venda.customer.photo}
                                alt={venda.customer.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-5 w-5 text-stone-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-stone-900">
                              {venda.customer ? venda.customer.name : 'Cliente não informado'}
                            </h3>
                            <div className="flex items-center space-x-3 text-xs text-stone-500 mt-0.5">
                              {venda.customer && (
                                <>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{venda.customer.phone}</span>
                                  </div>
                                  <span>•</span>
                                </>
                              )}
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDateTime(venda.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center space-x-1 text-stone-600">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-semibold">{formatCurrency(venda.total)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-stone-600">
                            <CreditCard className="h-3 w-3" />
                            <span>{paymentMethodLabels[venda.paymentMethod] || venda.paymentMethod}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-stone-600">
                            <Package className="h-3 w-3" />
                            <span>{venda.items.length} item{venda.items.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {venda.professional && (
                          <div className="mt-2 flex items-center space-x-1 text-xs text-stone-600">
                            <Scissors className="h-3 w-3" />
                            <span>Profissional: {venda.professional}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
        </Card>
    </div>
  );
}