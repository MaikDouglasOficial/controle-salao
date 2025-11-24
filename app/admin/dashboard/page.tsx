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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Aprimorado */}
        <div className="text-center pb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-lg animate-bounce-in">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 bg-clip-text text-transparent leading-tight pb-2">
            Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Visão completa e em tempo real do seu negócio
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-primary-500 to-primary-600 mx-auto rounded-full animate-slideDown"></div>
        </div>

        {/* Cards de Estatísticas Aprimorados */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={index} 
                hover 
                className={`group animate-stagger-${(index % 4) + 1} transform hover:scale-105 transition-all duration-500 hover:shadow-xl border-0 shadow-md bg-white/80 backdrop-blur-sm overflow-hidden`}
              >
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 truncate">
                        {card.title}
                      </p>
                      <p className={`text-3xl font-bold ${card.textColor} transition-colors duration-300 truncate`}>
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`h-16 w-16 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg flex-shrink-0`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Barra de progresso decorativa */}
                  <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${card.color} rounded-full animate-slideRight`}
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Alertas Aprimorados */}
        {stats && stats.produtosEstoqueBaixo > 0 && (
          <div className="animate-slideDown">
            <Alert 
              variant="warning" 
              title="Estoque Baixo"
              className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-500"
            >
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-amber-600" />
                <span>
                  <span className="font-bold text-amber-700">{stats.produtosEstoqueBaixo}</span>{' '}
                  produto(s) com estoque baixo. 
                  <button 
                    onClick={() => router.push('/admin/produtos')}
                    className="ml-2 text-amber-700 underline hover:text-amber-800 font-medium"
                  >
                    Verificar produtos →
                  </button>
                </span>
              </div>
            </Alert>
          </div>
        )}

        {/* Gráficos Aprimorados */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Receita vs Despesa */}
          <Card className="animate-slideLeft hover:shadow-xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader 
              title="Receita vs Despesa" 
              subtitle="Últimos 6 meses"
              className="pb-4"
            />
            <CardBody className="pt-0">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="receita" fill="#10b981" name="Receita" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="despesa" fill="#ef4444" name="Despesa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Resumo Financeiro Aprimorado */}
          <Card className="animate-slideRight hover:shadow-xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader 
              title="Resumo Financeiro" 
              subtitle="Visão consolidada"
              className="pb-4"
            />
            <CardBody className="pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Receita Total (Mês)</span>
                  </div>
                  <span className="font-bold text-emerald-600 text-xl">
                    {formatCurrency(stats?.lucroMes || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Despesas (Mês)</span>
                  </div>
                  <span className="font-bold text-red-600 text-xl">
                    {formatCurrency(stats?.despesasMes || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-gray-800 font-bold text-lg">Lucro Líquido</span>
                  </div>
                  <span className="font-bold text-primary-700 text-2xl">
                    {formatCurrency(stats?.lucroLiquido || 0)}
                  </span>
                </div>

                <div className="pt-4 space-y-4 border-t border-gray-100">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-primary-500" />
                      <span className="text-gray-700 font-medium">Agendamentos hoje</span>
                    </div>
                    <span className="font-bold text-primary-600 text-lg">{stats?.agendamentosHoje || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-orange-500" />
                      <span className="text-gray-700 font-medium">Total de clientes</span>
                    </div>
                    <span className="font-bold text-orange-600 text-lg">{stats?.clientesTotal || 0}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Próximos Agendamentos Aprimorados */}
        <Card className="animate-fade-in hover:shadow-xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader 
            title="Próximos Agendamentos"
            subtitle={`${proximosAgendamentos.length} agendamento${proximosAgendamentos.length !== 1 ? 's' : ''} próximo${proximosAgendamentos.length !== 1 ? 's' : ''}`}
            className="border-b border-gray-100"
          >
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              onClick={() => router.push('/admin/agendamentos')}
              className="hover:scale-105 transition-transform duration-200"
            >
              Ver todos
            </Button>
          </CardHeader>
        
        <CardBody>
          {proximosAgendamentos.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8 text-gray-400" />}
              title="Nenhum agendamento próximo"
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
            <div className="space-y-4">
              {proximosAgendamentos.map((agendamento, index) => (
                <div
                  key={agendamento.id}
                  onClick={() => router.push('/admin/agendamentos')}
                  className={`p-6 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-stagger-${(index % 4) + 1}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 overflow-hidden relative bg-gradient-to-br from-primary-500 to-primary-600">
                          {agendamento.customer.photo ? (
                            <Image
                              src={agendamento.customer.photo}
                              alt={agendamento.customer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-7 w-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                            {agendamento.customer.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{agendamento.customer.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 ml-18">
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                          <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Scissors className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="text-gray-800 font-semibold text-sm">{agendamento.service.name}</span>
                            <div className="text-xs text-gray-500">
                              {agendamento.service.duration}min • {formatCurrency(agendamento.service.price)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-gray-800 font-semibold text-sm">
                              {new Date(agendamento.date).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            <div className="text-xs text-gray-500">{agendamento.time}</div>
                          </div>
                        </div>

                        {agendamento.professional && (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <span className="text-gray-800 font-semibold text-sm">{agendamento.professional}</span>
                              <div className="text-xs text-gray-500">Profissional</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col items-end space-y-2">
                      <Badge 
                        variant={getStatusBadgeVariant(agendamento.status)}
                        className="transform hover:scale-105 transition-transform duration-200"
                      >
                        {formatStatusText(agendamento.status)}
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

        {/* Aniversariantes do Mês Aprimorados */}
        <Card className="animate-slideUp hover:shadow-xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader 
            title="Aniversariantes do Mês"
            subtitle={`${aniversariantes.length} cliente${aniversariantes.length !== 1 ? 's' : ''} fazendo aniversário`}
            className="border-b border-gray-100"
          />
        
        <CardBody>
          {aniversariantes.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8 text-gray-400" />}
              title="Nenhum aniversariante este mês"
              description="Não há clientes fazendo aniversário este mês"
            />
          ) : (
            <div className="space-y-4">
              {aniversariantes.map((aniversariante, index) => {
                const birthday = new Date(aniversariante.birthday);
                const today = new Date();
                const isToday = birthday.getDate() === today.getDate() && 
                               birthday.getMonth() === today.getMonth();
                
                return (
                  <div
                    key={aniversariante.id}
                    className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer group animate-stagger-${(index % 4) + 1} hover:shadow-lg ${
                      isToday 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 hover:border-orange-300' 
                        : 'bg-gradient-to-r from-white to-gray-50 border-gray-100 hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ring-4 ring-white shadow-lg">
                          {aniversariante.photo ? (
                            <Image
                              src={aniversariante.photo}
                              alt={aniversariante.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold group-hover:text-primary-600 transition-colors duration-200 ${
                            isToday ? 'text-orange-700' : 'text-gray-900'
                          }`}>
                            {aniversariante.name}
                            {isToday && <span className="ml-2 text-sm font-semibold text-orange-600">(Hoje)</span>}
                          </h3>
                          <div className="flex items-center space-x-6 mt-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span className="font-medium">{aniversariante.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">
                                {birthday.toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isToday && (
                          <Badge 
                            variant="success"
                            className="animate-pulse bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                          >
                            Aniversário Hoje
                          </Badge>
                        )}
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
                          className="hover:scale-105 transition-transform duration-200"
                        >
                          {isToday ? 'Parabenizar' : 'Lembrar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
        </Card>

        {/* Vendas Recentes */}
        <Card className="animate-slideUp hover:shadow-xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader 
            title="Vendas Recentes"
            subtitle={`${vendasRecentes.length} venda${vendasRecentes.length !== 1 ? 's' : ''} realizada${vendasRecentes.length !== 1 ? 's' : ''}`}
            className="border-b border-gray-100"
          >
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              onClick={() => router.push('/admin/vendas')}
              className="hover:scale-105 transition-transform duration-200"
            >
              Ver todas
            </Button>
          </CardHeader>
        
        <CardBody>
          {vendasRecentes.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-8 w-8 text-gray-400" />}
              title="Nenhuma venda registrada"
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
            <div className="space-y-4">
              {vendasRecentes.map((venda, index) => {
                const vendaDate = new Date(venda.date);
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
                    className={`p-6 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-stagger-${(index % 4) + 1}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 overflow-hidden relative bg-gradient-to-br from-green-500 to-emerald-600">
                            {venda.customer?.photo ? (
                              <Image
                                src={venda.customer.photo}
                                alt={venda.customer.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-7 w-7 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                              {venda.customer ? venda.customer.name : 'Cliente não informado'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              {venda.customer && (
                                <>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{venda.customer.phone}</span>
                                  </div>
                                  <span className="text-gray-300">•</span>
                                </>
                              )}
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDateTime(venda.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 ml-18">
                          <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-xs font-medium text-gray-500">Total</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(venda.total)}</p>
                          </div>

                          <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <CreditCard className="h-4 w-4" />
                              <span className="text-xs font-medium text-gray-500">Pagamento</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{paymentMethodLabels[venda.paymentMethod] || venda.paymentMethod}</p>
                          </div>

                          <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <Package className="h-4 w-4" />
                              <span className="text-xs font-medium text-gray-500">Itens</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {venda.items.length} item{venda.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {venda.professional && (
                          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                            <Scissors className="h-4 w-4" />
                            <span className="font-medium">Profissional: {venda.professional}</span>
                          </div>
                        )}

                        {venda.items.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-2">Itens da venda:</p>
                            <div className="flex flex-wrap gap-2">
                              {venda.items.slice(0, 3).map((item, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="info"
                                  className="text-xs"
                                >
                                  {item.product?.name || item.service?.name || 'Item'} ({item.quantity}x)
                                </Badge>
                              ))}
                              {venda.items.length > 3 && (
                                <Badge variant="gray" className="text-xs">
                                  +{venda.items.length - 3} mais
                                </Badge>
                              )}
                            </div>
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
    </div>
  );
}