import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Função utilitária para mesclar classes do Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor monetário para BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número para exibição em input de valor (sempre 2 decimais: 250,00)
 */
export function formatCurrencyInput(value: number): string {
  if (value === 0) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return n.toFixed(2).replace('.', ',');
}

/**
 * Converte string digitada (250 ou 250,00 ou 250,5) em número
 */
export function parseCurrencyInput(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  const cleaned = input.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Formata data para formato brasileiro
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Formata data e hora para formato brasileiro
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}
