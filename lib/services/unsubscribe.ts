import crypto from "node:crypto";

const DEFAULT_SECRET = "default-unsubscribe-secret-brvm-2026";

function getSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || DEFAULT_SECRET;
}

/**
 * Génère un jeton HMAC SHA-256 pour sécuriser les liens de désinscription.
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = getSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(email.toLowerCase().trim())
    .digest("hex");
}

/**
 * Valide si le jeton correspond bien à l'email donné.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Génère l'URL complète de désinscription à intégrer dans l'email.
 */
export function getUnsubscribeUrl(email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = generateUnsubscribeToken(email);
  return `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

