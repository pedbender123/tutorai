import crypto from 'crypto';
import db from './db.js';
import { config } from './config.js';
import { sendEmail, verificationEmailContent } from './mailer.js';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Only actually enforced when both the flag is on AND a real mail provider is configured —
 *  otherwise flipping the flag alone would silently lock everyone out with unsendable emails. */
export function isVerificationEnforced(): boolean {
  return config.requireEmailVerification && config.mailProvider !== 'none';
}

function issueVerificationToken(userId: string): string {
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  db.prepare('UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?')
    .run(token, expires, userId);
  return token;
}

export async function sendVerificationEmail(userId: string, name: string, email: string): Promise<void> {
  const token = issueVerificationToken(userId);
  const verifyUrl = `${config.publicUrl}/api/auth/verify-email/${token}`;
  const content = verificationEmailContent(name, verifyUrl);
  await sendEmail({ to: email, ...content });
}

export async function resendVerificationEmail(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = db.prepare('SELECT name, email, emailVerified FROM users WHERE id = ?').get(userId) as
    { name: string; email: string; emailVerified: number } | undefined;
  if (!user) return { ok: false, error: 'Usuário não encontrado.' };
  if (user.emailVerified) return { ok: false, error: 'Este e-mail já está verificado.' };
  await sendVerificationEmail(userId, user.name, user.email);
  return { ok: true };
}

/** Gate used by Lab/Levy/chat before an AI call — a no-op allow while enforcement is off. */
export function checkEmailVerified(userId: string): { allowed: boolean; reason?: string } {
  if (!isVerificationEnforced()) return { allowed: true };
  const user = db.prepare('SELECT emailVerified FROM users WHERE id = ?').get(userId) as { emailVerified: number } | undefined;
  if (user?.emailVerified) return { allowed: true };
  return { allowed: false, reason: 'Confirme seu e-mail para usar este recurso — verifique sua caixa de entrada ou peça um novo link em Configurações.' };
}

export function confirmVerificationToken(token: string): { ok: true } | { ok: false; error: string } {
  const user = db.prepare(
    'SELECT id, email_verification_expires FROM users WHERE email_verification_token = ?'
  ).get(token) as { id: string; email_verification_expires: string } | undefined;

  if (!user) return { ok: false, error: 'Link de verificação inválido.' };
  if (!user.email_verification_expires || new Date(user.email_verification_expires) < new Date()) {
    return { ok: false, error: 'Link de verificação expirado. Peça um novo em Configurações.' };
  }

  db.prepare(
    'UPDATE users SET emailVerified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?'
  ).run(user.id);
  return { ok: true };
}
