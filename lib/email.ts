import nodemailer from 'nodemailer';

const salonName = process.env.SALON_NAME || 'Salão';
const fromEmail = process.env.REMINDER_FROM_EMAIL || process.env.SMTP_USER || 'noreply@localhost';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

export interface ReminderData {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  appointmentDate: Date;
  professional?: string;
  salonName?: string;
}

export async function sendAppointmentReminder(data: ReminderData): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: 'E-mail não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env' };
  }

  const dateFormatted = data.appointmentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = data.appointmentDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const name = data.salonName || salonName;

  const subject = `Lembrete: seu agendamento no ${name}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #333;">Olá, ${data.customerName}!</h2>
      <p>Este é um lembrete do seu agendamento no <strong>${name}</strong>.</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Serviço:</strong> ${data.serviceName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Data:</strong> ${dateFormatted}</p>
        <p style="margin: 0 0 8px 0;"><strong>Horário:</strong> ${timeFormatted}</p>
        ${data.professional ? `<p style="margin: 0;"><strong>Profissional:</strong> ${data.professional}</p>` : ''}
      </div>
      <p style="color: #666; font-size: 14px;">Caso precise remarcar, entre em contato conosco.</p>
      <p style="color: #666; font-size: 14px;">Até lá!</p>
    </div>
  `;
  const text = `Olá, ${data.customerName}! Lembrete do seu agendamento no ${name}. Serviço: ${data.serviceName}. Data: ${dateFormatted}. Horário: ${timeFormatted}.${data.professional ? ` Profissional: ${data.professional}.` : ''}`;

  try {
    await transporter.sendMail({
      from: `"${name}" <${fromEmail}>`,
      to: data.customerEmail,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar e-mail';
    return { ok: false, error: message };
  }
}
