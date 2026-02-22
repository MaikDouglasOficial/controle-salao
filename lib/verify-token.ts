import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';
const EXPIRY_MINUTES = 15;

/**
 * Gera um token assinado para uso único após verificação do código (criar senha).
 * Payload: customerId + exp (timestamp).
 */
export function createVerifyToken(customerId: number): string {
  const exp = Date.now() + EXPIRY_MINUTES * 60 * 1000;
  const payload = `${customerId}.${exp}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Valida o token e retorna o customerId se válido.
 */
export function verifyToken(token: string): number | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const payload = Buffer.from(encoded, 'base64url').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const [customerIdStr, expStr] = payload.split('.');
    const exp = parseInt(expStr, 10);
    if (Date.now() > exp) return null;
    const customerId = parseInt(customerIdStr, 10);
    if (!Number.isInteger(customerId) || customerId < 1) return null;
    return customerId;
  } catch {
    return null;
  }
}
