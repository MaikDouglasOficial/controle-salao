import { z } from 'zod';
import { APPOINTMENT_STATUS, PAYMENT_METHODS } from './constants';

const optionalString = z.union([z.string(), z.null(), z.undefined()]).transform((v) => (v === '' || v === null || v === undefined ? null : String(v)));
const optionalNumber = z.union([z.number(), z.null(), z.undefined()]);

const statusEnum = z.enum([APPOINTMENT_STATUS.AGENDADO, APPOINTMENT_STATUS.CONFIRMADO, APPOINTMENT_STATUS.CONCLUIDO, APPOINTMENT_STATUS.FATURADO, APPOINTMENT_STATUS.CANCELADO]);

export const appointmentPostSchema = z.object({
  customerId: z.coerce.number().int().positive('Cliente é obrigatório'),
  serviceId: z.coerce.number().int().positive('Serviço é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  status: statusEnum.optional().default(APPOINTMENT_STATUS.AGENDADO),
  professional: optionalString.optional(),
  notes: optionalString.optional(),
});

/** Agendamento público (cliente): telefone + nome opcional; serviceId ou serviceIds[] (vários serviços em sequência). */
export const bookingPostSchema = z.object({
  phone: z.string().min(1, 'Telefone é obrigatório'),
  name: z.string().optional(),
  serviceId: z.coerce.number().int().positive().optional(),
  serviceIds: z.array(z.coerce.number().int().positive()).optional(),
  date: z.string().min(1, 'Data e horário são obrigatórios'),
  professional: optionalString.optional(),
  notes: optionalString.optional(),
}).refine((d) => (d.serviceIds && d.serviceIds.length > 0) || (d.serviceId != null && d.serviceId > 0), {
  message: 'Informe ao menos um serviço (serviceId ou serviceIds).',
});

export const appointmentPutSchema = z.object({
  id: z.coerce.number().int().positive('ID do agendamento é obrigatório'),
  customerId: z.coerce.number().int().positive('Cliente é obrigatório'),
  serviceId: z.coerce.number().int().positive('Serviço é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  status: statusEnum,
  professional: optionalString.optional(),
  notes: optionalString.optional(),
  cancellationReason: optionalString.optional(),
});

export const customerPostSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: optionalString.optional(),
  cpf: optionalString.optional(),
  birthday: z.union([z.string(), z.null(), z.undefined()]).transform((v) => (v && v !== '' ? new Date(v) : null)),
  notes: optionalString.optional(),
  photo: optionalString.optional(),
});

export const customerPutSchema = z.object({
  id: z.coerce.number().int().positive('ID do cliente é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: optionalString.optional(),
  cpf: optionalString.optional(),
  birthday: z.union([z.string(), z.null(), z.undefined()]).transform((v) => (v && v !== '' ? new Date(v) : null)),
  notes: optionalString.optional(),
  photo: optionalString.optional(),
});

const salePaymentSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS),
  value: z.coerce.number().positive('Valor deve ser maior que zero'),
  installments: z.coerce.number().int().min(1).max(12).optional(),
  installmentValue: z.coerce.number().positive().optional(),
});

const saleItemSchema = z.object({
  productId: z.coerce.number().int().positive().optional().nullable(),
  serviceId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().int().positive('Quantidade deve ser pelo menos 1'),
  price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
}).refine((d) => d.productId != null || d.serviceId != null, { message: 'Item deve ter produto ou serviço' });

export const salePostSchema = z.object({
  customerId: z.union([z.coerce.number().int().positive(), z.null(), z.undefined()]).optional(),
  professional: z.string().min(1, 'Profissional é obrigatório'),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  total: z.coerce.number().min(0, 'Total inválido'),
  items: z.array(saleItemSchema).min(1, 'A venda deve ter pelo menos um item'),
  installments: z.coerce.number().int().min(1).max(12).optional(),
  installmentValue: z.coerce.number().positive().optional(),
  appointmentId: z.union([z.coerce.number().int().positive(), z.null(), z.undefined()]).optional(),
  entradaValue: optionalNumber.optional(),
  entradaMethod: optionalString.optional(),
  payments: z.array(salePaymentSchema).optional(),
}).refine((data) => {
  const usePayments = Array.isArray(data.payments) && data.payments.length > 0;
  if (!usePayments) return true;
  const sum = data.payments!.reduce((acc, p) => acc + Number(p.value), 0);
  return Math.abs(sum - data.total) <= 0.01;
}, { message: 'A soma dos pagamentos deve ser igual ao total' });

export type AppointmentPostInput = z.infer<typeof appointmentPostSchema>;
export type AppointmentPutInput = z.infer<typeof appointmentPutSchema>;
export type CustomerPostInput = z.infer<typeof customerPostSchema>;
export type CustomerPutInput = z.infer<typeof customerPutSchema>;
export type SalePostInput = z.infer<typeof salePostSchema>;
