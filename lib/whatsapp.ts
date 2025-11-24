import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WhatsAppMessage {
  to: string;
  message: string;
}

/**
 * Envia mensagem via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const token = process.env.META_WA_TOKEN;
    const phoneId = process.env.META_WA_PHONE_ID;

    if (!token || !phoneId) {
      console.warn('⚠️ WhatsApp não configurado. Defina META_WA_TOKEN e META_WA_PHONE_ID no .env');
      return { success: false, error: 'WhatsApp não configurado' };
    }

    // Remove caracteres não numéricos do telefone
    const cleanPhone = to.replace(/\D/g, '');

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ WhatsApp enviado:', response.data);
    return { success: true };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error('❌ Erro ao enviar WhatsApp:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Envia lembrete de agendamento
 */
export async function sendAppointmentReminder(appointmentId: number): Promise<void> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    // Verifica se já foi enviado lembrete
    const existingLog = await prisma.notificationLog.findFirst({
      where: {
        appointmentId: appointment.id,
        status: 'enviado',
      },
    });

    if (existingLog) {
      console.log('ℹ️ Lembrete já enviado para este agendamento');
      return;
    }

    const hora = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(appointment.date));

    const message = `Olá, ${appointment.customer.name}! 💇‍♀️✨\n\nLembrando que você tem um horário marcado hoje às ${hora} para ${appointment.service.name}.\n\nAguardamos você!`;

    const result = await sendWhatsAppMessage({
      to: appointment.customer.phone,
      message,
    });

    // Salva log da notificação
    await prisma.notificationLog.create({
      data: {
        appointmentId: appointment.id,
        message,
        status: result.success ? 'enviado' : 'erro',
        errorMessage: result.error,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao enviar lembrete:', error.message);
    
    // Salva log de erro
    await prisma.notificationLog.create({
      data: {
        appointmentId,
        message: 'Erro ao processar lembrete',
        status: 'erro',
        errorMessage: error.message,
      },
    });
  }
}
