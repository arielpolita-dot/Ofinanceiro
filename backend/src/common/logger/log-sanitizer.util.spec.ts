import { sanitizeLogData } from './log-sanitizer.util';

describe('sanitizeLogData', () => {
  describe('primitive values', () => {
    it('should return null as-is', () => {
      expect(sanitizeLogData(null)).toBeNull();
    });

    it('should return undefined as-is', () => {
      expect(sanitizeLogData(undefined)).toBeUndefined();
    });

    it('should return strings as-is', () => {
      expect(sanitizeLogData('hello')).toBe('hello');
    });

    it('should return numbers as-is', () => {
      expect(sanitizeLogData(42)).toBe(42);
    });

    it('should return booleans as-is', () => {
      expect(sanitizeLogData(true)).toBe(true);
    });
  });

  describe('sensitive field redaction', () => {
    it('should redact password field', () => {
      const input = { username: 'john', password: 'secret123' };

      const result = sanitizeLogData(input);

      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
      });
    });

    it('should redact token field', () => {
      const result = sanitizeLogData({ token: 'abc123' });
      expect(result).toEqual({ token: '[REDACTED]' });
    });

    it('should redact apiKey field (case-insensitive)', () => {
      const result = sanitizeLogData({ apiKey: 'key-123' });
      expect(result).toEqual({ apiKey: '[REDACTED]' });
    });

    it('should redact api_key field', () => {
      const result = sanitizeLogData({ api_key: 'key-123' });
      expect(result).toEqual({ api_key: '[REDACTED]' });
    });

    it('should redact authorization field', () => {
      const result = sanitizeLogData({
        authorization: 'Bearer xyz',
      });
      expect(result).toEqual({ authorization: '[REDACTED]' });
    });

    it('should redact creditCard and credit_card', () => {
      const result = sanitizeLogData({
        creditCard: '4111-1111',
        credit_card: '4111-2222',
      });
      expect(result).toEqual({
        creditCard: '[REDACTED]',
        credit_card: '[REDACTED]',
      });
    });

    it('should redact cpf and ssn', () => {
      const result = sanitizeLogData({
        cpf: '123.456.789-00',
        ssn: '123-45-6789',
      });
      expect(result).toEqual({
        cpf: '[REDACTED]',
        ssn: '[REDACTED]',
      });
    });

    it('should redact secret field', () => {
      const result = sanitizeLogData({ secret: 'my-secret' });
      expect(result).toEqual({ secret: '[REDACTED]' });
    });

    it('should redact refresh_token and access_token', () => {
      const result = sanitizeLogData({
        refreshToken: 'rt-123',
        access_token: 'at-456',
      });
      expect(result).toEqual({
        refreshToken: '[REDACTED]',
        access_token: '[REDACTED]',
      });
    });
  });

  describe('nested objects', () => {
    it('should redact sensitive fields in nested objects', () => {
      const input = {
        user: {
          email: 'john@test.com',
          password: 'secret',
          profile: { name: 'John' },
        },
      };

      const result = sanitizeLogData(input) as Record<string, unknown>;
      const user = result['user'] as Record<string, unknown>;

      expect(user['email']).toBe('john@test.com');
      expect(user['password']).toBe('[REDACTED]');
      expect(user['profile']).toEqual({ name: 'John' });
    });

    it('should handle deeply nested sensitive fields', () => {
      const input = {
        level1: {
          level2: {
            level3: { token: 'deep-secret', safe: 'visible' },
          },
        },
      };

      const result = sanitizeLogData(input);
      expect(result).toEqual({
        level1: {
          level2: {
            level3: { token: '[REDACTED]', safe: 'visible' },
          },
        },
      });
    });
  });

  describe('arrays', () => {
    it('should sanitize objects inside arrays', () => {
      const input = [
        { name: 'Alice', password: 'pass1' },
        { name: 'Bob', password: 'pass2' },
      ];

      const result = sanitizeLogData(input);

      expect(result).toEqual([
        { name: 'Alice', password: '[REDACTED]' },
        { name: 'Bob', password: '[REDACTED]' },
      ]);
    });

    it('should handle arrays of primitives', () => {
      expect(sanitizeLogData([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('immutability', () => {
    it('should not modify the original object', () => {
      const input = { password: 'secret', name: 'John' };
      const original = { ...input };

      sanitizeLogData(input);

      expect(input).toEqual(original);
    });
  });
});
