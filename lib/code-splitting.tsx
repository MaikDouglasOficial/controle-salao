/**
 * Sistema de Code Splitting Dinâmico
 * 
 * Este arquivo exporta componentes lazy-loaded para otimizar
 * o carregamento inicial da aplicação. Os módulos só são
 * carregados quando o usuário navega para a respectiva página.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/Loading';

// Loading fallback padrão
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

// ===== COMPONENTES PESADOS (Charts, Calendários, etc) =====
// Nota: Modais de CRUD foram substituídos por páginas dedicadas
// Apenas modais para confirmações e ações críticas devem ser usados

// Chart.js lazy loading
export const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart').then(mod => ({ default: mod.RevenueChart })),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  }
);

export const AppointmentsChart = dynamic(
  () => import('@/components/charts/AppointmentsChart').then(mod => ({ default: mod.AppointmentsChart })),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  }
);

// Calendário lazy loading
export const CalendarView = dynamic(
  () => import('@/components/calendar/CalendarView'),
  {
    loading: () => (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    ),
    ssr: false,
  }
);

// Editor de rich text (se houver)
export const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

// ===== EXPORTAÇÕES DE CONFIGURAÇÃO =====

/**
 * Configuração de prefetch para rotas principais
 * Estas rotas serão pré-carregadas em background após o carregamento inicial
 */
export const PREFETCH_ROUTES = [
  '/admin/dashboard',
  '/admin/clientes',
  '/admin/produtos',
  '/admin/servicos',
  '/admin/profissionais',
] as const;

/**
 * Rotas que devem ter prioridade de carregamento
 */
export const PRIORITY_ROUTES = [
  '/admin/dashboard',
  '/admin/clientes',
] as const;

/**
 * Configuração de cache para diferentes tipos de dados
 */
export const CACHE_CONFIG = {
  // Dados estáticos que mudam pouco
  static: {
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  },
  // Dados dinâmicos que mudam frequentemente
  dynamic: {
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 5, // 5 minutos
  },
  // Dados em tempo real
  realtime: {
    staleTime: 0,
    gcTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 10, // Atualiza a cada 10 segundos
  },
} as const;
