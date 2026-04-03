/**
 * ==============================================================================
 * EncryptionService - Servico de Criptografia Centralizado
 * ==============================================================================
 *
 * Servico responsavel por toda logica de criptografia da aplicacao.
 * Extraido do ProjectsService para respeitar o Single Responsibility Principle.
 *
 * ## Algoritmos Suportados
 *
 * | Algoritmo     | Uso           | Caracteristicas                    |
 * |---------------|---------------|-----------------------------------|
 * | AES-256-GCM   | Atual         | Autenticacao AEAD, mais seguro    |
 * | AES-256-CBC   | Legacy        | Compatibilidade com dados antigos |
 *
 * ## Formato de Dados Criptografados
 *
 * ```
 * GCM (atual):  iv:authTag:ciphertext
 * CBC (legacy): iv:ciphertext
 * ```
 *
 * ## Seguranca
 *
 * - Chave derivada via scrypt (resistente a ataques de forca bruta)
 * - IV unico por operacao (previne replay attacks)
 * - Auth Tag no GCM garante integridade (detecta tampering)
 *
 * @module common/services
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly legacyAlgorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly ivLength = 12; // 12 bytes for GCM, 16 for CBC

  constructor(private readonly configService: ConfigService) {
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    const saltValue = this.configService.get<string>('ENCRYPTION_SALT') || 'ofinanceiro-key-salt-v1';
    const salt = crypto.createHash('sha256').update(saltValue).digest();
    this.key = crypto.scryptSync(keyString, salt, 32);
  }

  /**
   * =========================================================================
   * encrypt - Criptografia AES-256-GCM
   * =========================================================================
   *
   * Criptografa texto sensivel usando AES-256-GCM (Authenticated Encryption).
   *
   * ## Formato de Saida
   *
   * ```
   * iv:authTag:ciphertext
   * |   |       |-- Texto cifrado (hex)
   * |   |-- Tag de autenticacao (16 bytes hex)
   * |-- Vetor de inicializacao (12 bytes hex)
   * ```
   *
   * @param plainText - Texto plano para criptografar
   * @returns Texto criptografado no formato iv:authTag:ciphertext
   *
   * @example
   * ```typescript
   * const encrypted = encryptionService.encrypt('meu-segredo');
   * // Retorna: "a1b2c3...:d4e5f6...:g7h8i9..."
   * ```
   */
  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * =========================================================================
   * decrypt - Descriptografia AES-256-GCM/CBC
   * =========================================================================
   *
   * Descriptografa texto cifrado. Suporta dois formatos para compatibilidade:
   *
   * ## Formato GCM (Atual)
   * ```
   * iv:authTag:ciphertext (3 partes)
   * ```
   *
   * ## Formato CBC (Legacy)
   * ```
   * iv:ciphertext (2 partes)
   * ```
   *
   * @param encryptedText - Texto criptografado
   * @returns Texto descriptografado
   * @throws {Error} Se formato invalido ou auth tag nao bate
   *
   * @example
   * ```typescript
   * const decrypted = encryptionService.decrypt(encrypted);
   * // Retorna: "meu-segredo"
   * ```
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');

    // Support both old CBC format (iv:encrypted) and new GCM format (iv:authTag:encrypted)
    if (parts.length === 2) {
      return this.decryptLegacyCBC(parts[0], parts[1]);
    }

    // New GCM format
    return this.decryptGCM(parts[0], parts[1], parts[2]);
  }

  /**
   * Descriptografa texto de forma segura, retornando null em caso de erro.
   * Usado quando a falha na descriptografia nao deve interromper o fluxo.
   *
   * @param encryptedText - Texto criptografado
   * @returns Texto descriptografado ou null em caso de erro
   *
   * @example
   * ```typescript
   * const result = encryptionService.safeDecrypt(possiblyCorruptedData);
   * if (result === null) {
   *   // Tratar erro de descriptografia
   * }
   * ```
   */
  safeDecrypt(encryptedText: string): string | null {
    try {
      return this.decrypt(encryptedText);
    } catch {
      return null;
    }
  }

  /**
   * Verifica se um valor esta criptografado.
   *
   * Detecta o formato baseado na estrutura:
   * - GCM: iv(24 hex chars):authTag(32 hex chars):ciphertext
   * - CBC: iv(32 hex chars):ciphertext
   *
   * @param value - Valor para verificar
   * @returns true se o valor parece estar criptografado
   *
   * @example
   * ```typescript
   * if (encryptionService.isEncrypted(value)) {
   *   const decrypted = encryptionService.decrypt(value);
   * }
   * ```
   */
  isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const parts = value.split(':');

    // GCM format: iv(24):authTag(32):ciphertext
    if (parts.length === 3) {
      return parts[0].length === 24 && parts[1].length === 32;
    }

    // Legacy CBC format: iv(32):ciphertext
    if (parts.length === 2) {
      return parts[0].length === 32;
    }

    return false;
  }

  /**
   * Descriptografa usando formato legacy CBC.
   * Mantido para compatibilidade com dados antigos.
   */
  private decryptLegacyCBC(ivHex: string, encrypted: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.legacyAlgorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Descriptografa usando formato GCM atual.
   */
  private decryptGCM(ivHex: string, authTagHex: string, encrypted: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
