/**
 * Status de agendamento - usar sempre minúsculo no banco e nas APIs.
 */
export const APPOINTMENT_STATUS = {
  AGENDADO: 'agendado',
  CONFIRMADO: 'confirmado',
  CONCLUIDO: 'concluido',
  FATURADO: 'faturado',
  CANCELADO: 'cancelado',
} as const;

export type AppointmentStatusValue = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

/** Valores considerados "atendimento realizado" (para dashboard e relatórios) */
export const APPOINTMENT_STATUS_COMPLETED: string[] = [
  APPOINTMENT_STATUS.CONCLUIDO,
  APPOINTMENT_STATUS.FATURADO,
];

/** Status que não são cancelado (para conflitos de horário) */
export const APPOINTMENT_STATUS_NOT_CANCELLED = [
  APPOINTMENT_STATUS.AGENDADO,
  APPOINTMENT_STATUS.CONFIRMADO,
  APPOINTMENT_STATUS.CONCLUIDO,
  APPOINTMENT_STATUS.FATURADO,
];

export const PAYMENT_METHODS = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
