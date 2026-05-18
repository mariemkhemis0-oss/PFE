// backend/services/credentialService.js
// ──────────────────────────────────────────────────────────────
// Chiffrement AES-256-GCM pour les credentials en base de données
// ──────────────────────────────────────────────────────────────

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Dériver une clé de 32 bytes à partir du JWT_SECRET
const SECRET = process.env.JWT_SECRET || 'cyberaudit_secret_key';
const ENCRYPTION_KEY = crypto.scryptSync(SECRET, 'shieldops_credential_salt', 32);
const ALGORITHM = 'aes-256-gcm';

/**
 * Chiffre un texte en clair avec AES-256-GCM
 * @param {string} plaintext - Texte à chiffrer
 * @returns {string} Format: iv:authTag:ciphertext (hex)
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Déchiffre un texte chiffré avec AES-256-GCM
 * @param {string} ciphertext - Format: iv:authTag:encrypted (hex)
 * @returns {string} Texte en clair
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  if (!ivHex || !authTagHex || !encrypted) throw new Error('Format de chiffrement invalide');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
