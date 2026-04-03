import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ENCRYPTION_KEY') return 'test-encryption-key-2024';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  describe('constructor', () => {
    it('should throw if ENCRYPTION_KEY is not configured', () => {
      const noKeyConfig = { get: jest.fn().mockReturnValue(undefined) };
      expect(
        () => new EncryptionService(noKeyConfig as unknown as ConfigService),
      ).toThrow('ENCRYPTION_KEY not configured');
    });

    it('should throw if ENCRYPTION_KEY is empty string', () => {
      const emptyConfig = { get: jest.fn().mockReturnValue('') };
      expect(
        () => new EncryptionService(emptyConfig as unknown as ConfigService),
      ).toThrow('ENCRYPTION_KEY not configured');
    });
  });

  describe('encrypt', () => {
    it('should return a string in iv:authTag:ciphertext format', () => {
      const result = service.encrypt('hello');
      const parts = result.split(':');
      expect(parts).toHaveLength(3);
      // IV = 12 bytes = 24 hex chars
      expect(parts[0]).toHaveLength(24);
      // Auth tag = 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Ciphertext should be non-empty hex
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it('should produce different ciphertexts for same plaintext (unique IV)', () => {
      const a = service.encrypt('same-text');
      const b = service.encrypt('same-text');
      expect(a).not.toEqual(b);
    });

    it('should handle empty string', () => {
      const result = service.encrypt('');
      expect(result.split(':')).toHaveLength(3);
    });

    it('should handle unicode characters', () => {
      const result = service.encrypt('olá mundo 🚀');
      expect(result.split(':')).toHaveLength(3);
    });

    it('should handle long strings', () => {
      const longText = 'a'.repeat(10000);
      const result = service.encrypt(longText);
      expect(result.split(':')).toHaveLength(3);
    });
  });

  describe('decrypt', () => {
    it('should roundtrip encrypt/decrypt for simple text', () => {
      const plain = 'my-secret-value';
      const encrypted = service.encrypt(plain);
      expect(service.decrypt(encrypted)).toBe(plain);
    });

    it('should roundtrip empty string', () => {
      const encrypted = service.encrypt('');
      expect(service.decrypt(encrypted)).toBe('');
    });

    it('should roundtrip unicode', () => {
      const plain = 'olá mundo 🚀 café';
      const encrypted = service.encrypt(plain);
      expect(service.decrypt(encrypted)).toBe(plain);
    });

    it('should roundtrip long strings', () => {
      const plain = 'x'.repeat(5000);
      const encrypted = service.encrypt(plain);
      expect(service.decrypt(encrypted)).toBe(plain);
    });

    it('should roundtrip special characters', () => {
      const plain = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
      const encrypted = service.encrypt(plain);
      expect(service.decrypt(encrypted)).toBe(plain);
    });

    it('should throw on tampered auth tag', () => {
      const encrypted = service.encrypt('secret');
      const parts = encrypted.split(':');
      parts[1] = '0'.repeat(32); // tamper auth tag
      expect(() => service.decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = service.encrypt('secret');
      const parts = encrypted.split(':');
      parts[2] = '00' + parts[2].substring(2); // tamper ciphertext
      expect(() => service.decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on invalid hex input', () => {
      expect(() => service.decrypt('zz:zz:zz')).toThrow();
    });
  });

  describe('safeDecrypt', () => {
    it('should return decrypted value for valid input', () => {
      const encrypted = service.encrypt('safe-value');
      expect(service.safeDecrypt(encrypted)).toBe('safe-value');
    });

    it('should return null for tampered data', () => {
      expect(service.safeDecrypt('bad:data:here')).toBeNull();
    });

    it('should return null for completely invalid input', () => {
      expect(service.safeDecrypt('not-encrypted-at-all')).toBeNull();
    });
  });

  describe('decrypt - legacy CBC format (lines 120, 192-196)', () => {
    it('should decrypt legacy CBC format (2-part iv:ciphertext)', () => {
      // Manually encrypt with CBC to test the legacy path
      const crypto = require('crypto');
      const salt = crypto.createHash('sha256').update('ofinanceiro-key-salt-v1').digest();
      const key = crypto.scryptSync('test-encryption-key-2024', salt, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update('legacy-secret', 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const cbcEncrypted = `${iv.toString('hex')}:${encrypted}`;

      const result = service.decrypt(cbcEncrypted);
      expect(result).toBe('legacy-secret');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for GCM format (iv:authTag:ciphertext)', () => {
      const encrypted = service.encrypt('test');
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('should return true for CBC format (32-char iv:ciphertext)', () => {
      const cbcLike = 'a'.repeat(32) + ':' + 'deadbeef';
      expect(service.isEncrypted(cbcLike)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(service.isEncrypted('hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isEncrypted('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(service.isEncrypted(null as unknown as string)).toBe(false);
      expect(service.isEncrypted(undefined as unknown as string)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(service.isEncrypted(123 as unknown as string)).toBe(false);
    });

    it('should return false for wrong IV length in GCM format', () => {
      expect(service.isEncrypted('short:' + 'a'.repeat(32) + ':data')).toBe(false);
    });

    it('should return false for 4-part string', () => {
      expect(service.isEncrypted('a:b:c:d')).toBe(false);
    });
  });
});
