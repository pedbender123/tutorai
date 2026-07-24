import { config } from './config.js';

/**
 * Pluggable transactional email module.
 *
 * Structure is ready (verification, activity reminders, new activity, terms updates,
 * platform news); actual sending is a no-op (just logs) until MAIL_PROVIDER is set to
 * a real provider — see config.mailProvider. Domain recommendation: use a transactional
 * API (Resend/SES) with SPF/DKIM on scaffl.com.br rather than self-hosting SMTP — a
 * fresh self-hosted mail server has no sender reputation and tends to land in spam or
 * get rejected outright by Gmail/Outlook.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailPayload extends EmailContent {
  to: string;
}

interface MailProvider {
  send(payload: EmailPayload): Promise<void>;
}

function createNoopProvider(): MailProvider {
  return {
    async send(payload) {
      console.log(`[mailer] (sem provedor configurado, modo no-op) enviaria para ${payload.to}: "${payload.subject}"`);
    },
  };
}

function getMailProvider(): MailProvider {
  switch (config.mailProvider) {
    // TODO: implementar quando houver credencial real de um provedor.
    // case 'resend': return createResendProvider(process.env.RESEND_API_KEY!);
    // case 'ses':    return createSesProvider();
    // case 'smtp':   return createSmtpProvider({ host: process.env.SMTP_HOST!, ... });
    case 'none':
    default:
      return createNoopProvider();
  }
}

/** Sends an email. Never throws — a mail failure must never break the caller's main flow. */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  try {
    await getMailProvider().send(payload);
  } catch (err) {
    console.error('[mailer] falha ao enviar e-mail:', err);
  }
}

// ── Layout ────────────────────────────────────────────────────────────────

function layout(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;padding:12px 22px;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;text-decoration:none;font-weight:600;font-size:14px;">${ctaLabel}</a>`
    : '';
  return `<!doctype html>
<html><body style="margin:0;background:#0b0f19;color:#e5e7eb;font-family:-apple-system,Segoe UI,sans-serif;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#11162a;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:32px;">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8b5cf6;font-weight:700;margin-bottom:14px;">Scaffl</div>
    <h1 style="font-size:19px;margin:0 0 14px;color:#f4f4f5;">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#c7cad1;">${bodyHtml}</div>
    ${cta}
    <p style="color:#5b6472;font-size:11px;margin-top:36px;border-top:1px solid rgba(255,255,255,.08);padding-top:16px;">
      Você recebeu isto porque tem uma conta no Scaffl. Gerencie preferências de notificação em Configurações.
    </p>
  </div>
</body></html>`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ── Templates ─────────────────────────────────────────────────────────────

export function verificationEmailContent(name: string, verifyUrl: string): EmailContent {
  const body = `<p>Olá, ${name}! Confirme seu e-mail pra liberar o Lab, o Levy e o chat.</p>`;
  const html = layout('Confirme seu e-mail', body, 'Confirmar e-mail', verifyUrl);
  return { subject: 'Confirme seu e-mail no Scaffl', html, text: stripTags(body) + ` ${verifyUrl}` };
}

export function newActivityEmailContent(studentName: string, activityTitle: string, dueDate: string, classroomUrl: string): EmailContent {
  const body = `<p>Olá, ${studentName}! Uma nova atividade foi publicada na sua sala:</p><p><strong>${activityTitle}</strong><br/>Prazo: ${dueDate}</p>`;
  const html = layout('Nova atividade', body, 'Ver atividade', classroomUrl);
  return { subject: `Nova atividade: ${activityTitle}`, html, text: stripTags(body) };
}

export function activityDeadlineReminderContent(studentName: string, activityTitle: string, dueDate: string, classroomUrl: string): EmailContent {
  const body = `<p>Olá, ${studentName}! O prazo da atividade <strong>${activityTitle}</strong> está chegando: ${dueDate}.</p>`;
  const html = layout('Prazo se aproximando', body, 'Ver atividade', classroomUrl);
  return { subject: `Prazo chegando: ${activityTitle}`, html, text: stripTags(body) };
}

export function termsUpdateEmailContent(name: string, termsUrl: string): EmailContent {
  const body = `<p>Olá, ${name}. Atualizamos os termos de uso do Scaffl. Vale dar uma olhada nas mudanças.</p>`;
  const html = layout('Termos de uso atualizados', body, 'Ler termos atualizados', termsUrl);
  return { subject: 'Atualizamos nossos termos de uso', html, text: stripTags(body) };
}

export function platformNewsEmailContent(name: string, headline: string, summary: string, url: string): EmailContent {
  const body = `<p>Olá, ${name}!</p><p><strong>${headline}</strong></p><p>${summary}</p>`;
  const html = layout(headline, body, 'Saiba mais', url);
  return { subject: headline, html, text: stripTags(body) };
}
