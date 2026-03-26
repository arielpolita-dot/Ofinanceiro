import { sanitizeObject, extractError, SENSITIVE_FIELDS } from './audit-logger.types';

describe('audit-logger.types', () => {
  describe('SENSITIVE_FIELDS', () => {
    it('should contain expected sensitive field names', () => {
      expect(SENSITIVE_FIELDS).toContain('password');
      expect(SENSITIVE_FIELDS).toContain('token');
      expect(SENSITIVE_FIELDS).toContain('apiKey');
      expect(SENSITIVE_FIELDS).toContain('secret');
      expect(SENSITIVE_FIELDS).toContain('authorization');
      expect(SENSITIVE_FIELDS).toContain('cookie');
      expect(SENSITIVE_FIELDS).toContain('creditCard');
      expect(SENSITIVE_FIELDS).toContain('cvv');
    });
  });

  describe('sanitizeObject', () => {
    it('should redact sensitive fields', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        token: 'abc-token',
      };

      const result = sanitizeObject(input);

      expect(result.username).toBe('john');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
    });

    it('should be case-insensitive for field matching', () => {
      const result = sanitizeObject({
        Password: 'secret',
        API_KEY: 'key',
        AccessToken: 'tok',
      });

      // The matching uses .toLowerCase().includes() so partial matches work
      expect(result.Password).toBe('[REDACTED]');
      expect(result.AccessToken).toBe('[REDACTED]');
    });

    it('should recursively sanitize nested objects', () => {
      const result = sanitizeObject({
        user: {
          name: 'John',
          password: 'hidden',
          nested: {
            apiKey: 'secret-key',
          },
        },
      });

      const user = result.user as Record<string, unknown>;
      expect(user.name).toBe('John');
      expect(user.password).toBe('[REDACTED]');
      const nested = user.nested as Record<string, unknown>;
      expect(nested.apiKey).toBe('[REDACTED]');
    });

    it('should sanitize objects inside arrays', () => {
      const result = sanitizeObject({
        items: [
          { name: 'a', password: 'p1' },
          { name: 'b', token: 't1' },
        ],
      });

      const items = result.items as Record<string, unknown>[];
      expect(items[0].password).toBe('[REDACTED]');
      expect(items[1].token).toBe('[REDACTED]');
    });

    it('should pass through primitive array items', () => {
      const result = sanitizeObject({
        tags: ['a', 'b', 'c'],
        ids: [1, 2, 3],
      });

      expect(result.tags).toEqual(['a', 'b', 'c']);
      expect(result.ids).toEqual([1, 2, 3]);
    });

    it('should pass through non-sensitive fields unchanged', () => {
      const result = sanitizeObject({
        name: 'John',
        age: 30,
        active: true,
        data: null,
      });

      expect(result).toEqual({
        name: 'John',
        age: 30,
        active: true,
        data: null,
      });
    });

    it('should handle empty object', () => {
      expect(sanitizeObject({})).toEqual({});
    });

    it('should handle partial match of sensitive field names', () => {
      const result = sanitizeObject({
        userPassword: 'hidden',
        refreshToken: 'tok',
        mySecret: 'sss',
        cardNumber: '4111',
      });

      expect(result.userPassword).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.mySecret).toBe('[REDACTED]');
      expect(result.cardNumber).toBe('[REDACTED]');
    });
  });

  describe('extractError', () => {
    it('should return empty object for undefined', () => {
      expect(extractError(undefined)).toEqual({});
    });

    it('should extract message from string error', () => {
      const result = extractError('Something failed');
      expect(result).toEqual({ errorMessage: 'Something failed' });
      expect(result.errorStack).toBeUndefined();
    });

    it('should extract message and stack from Error object', () => {
      const error = new Error('Test error');
      const result = extractError(error);

      expect(result.errorMessage).toBe('Test error');
      expect(result.errorStack).toContain('Error: Test error');
    });

    it('should handle Error with no stack', () => {
      const error = new Error('No stack');
      error.stack = undefined;
      const result = extractError(error);

      expect(result.errorMessage).toBe('No stack');
      expect(result.errorStack).toBeUndefined();
    });
  });
});
