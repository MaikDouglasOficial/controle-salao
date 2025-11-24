import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendAppointmentReminder } from './whatsapp';

const prisma = new PrismaClient();

let cronJob: cron.ScheduledTask | null = null;

/**
 * Inicia o agendador de lembretes automáticos
 * Roda a cada 1 minuto e verifica agendamentos nas próximas 60 minutos
 */
export function startCronJobs() {
  if (cronJob) {
    console.log('⚠️ Cron job já está rodando');
    return;
  }

  // Roda a cada 1 minuto
  cronJob = cron.schedule('* * * * *', async () => {
    try {
      console.log('🔄 Verificando agendamentos para envio de lembretes...');

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Busca agendamentos confirmados nas próximas 60 minutos
      const appointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: now,
            lte: oneHourLater,
          },
          status: 'confirmado',
        },
        include: {
          notificationLogs: true,
        },
      });

      console.log(`📋 Encontrados ${appointments.length} agendamentos para verificar`);

      // Filtra apenas os que ainda não receberam lembrete
      const appointmentsToNotify = appointments.filter(
        (apt) => !apt.notificationLogs.some((log) => log.status === 'enviado')
      );

      console.log(`📲 Enviando ${appointmentsToNotify.length} lembretes...`);

      // Envia lembretes
      for (const appointment of appointmentsToNotify) {
        await sendAppointmentReminder(appointment.id);
      }

      if (appointmentsToNotify.length > 0) {
        console.log('✅ Lembretes enviados com sucesso');
      }
    } catch (error: any) {
      console.error('❌ Erro no cron job:', error.message);
    }
  });

  console.log('✅ Cron job iniciado - verificando agendamentos a cada minuto');
}

/**
 * Para o agendador de lembretes
 */
export function stopCronJobs() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('⏹️ Cron job parado');
  }
}
