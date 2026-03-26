import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SecureStoreService } from './secure-store.service';
import { SecureStore } from '../../database/entities/secure-store.entity';
import { EncryptionService } from './encryption.service';

describe('SecureStoreService', () => {
  let service: SecureStoreService;
  const mockRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };
  const mockEncryption = {
    encrypt: jest.fn().mockReturnValue('encrypted'),
    safeDecrypt: jest.fn().mockReturnValue('decrypted'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SecureStoreService,
        { provide: getRepositoryToken(SecureStore), useValue: mockRepo },
        { provide: EncryptionService, useValue: mockEncryption },
      ],
    }).compile();
    service = module.get(SecureStoreService);
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('creates new entry when key does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ namespace: 'ns', key: 'k' });
      mockRepo.save.mockResolvedValue({});
      await service.set('ns', 'k', 'plain');
      expect(mockEncryption.encrypt).toHaveBeenCalledWith('plain');
      expect(mockRepo.create).toHaveBeenCalledWith({
        namespace: 'ns', key: 'k', value: 'encrypted', expiresAt: null,
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('updates existing entry', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'uuid-1' });
      await service.set('ns', 'k', 'plain');
      expect(mockRepo.update).toHaveBeenCalledWith('uuid-1', {
        value: 'encrypted', expiresAt: null,
      });
    });

    it('sets expiresAt when ttlMs provided', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.set('ns', 'k', 'plain', 60000);
      const call = mockRepo.create.mock.calls[0][0];
      expect(call.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('get', () => {
    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.get('ns', 'k')).toBeNull();
    });

    it('returns decrypted value', async () => {
      mockRepo.findOne.mockResolvedValue({ value: 'enc', expiresAt: null });
      expect(await service.get('ns', 'k')).toBe('decrypted');
    });

    it('removes and returns null when expired', async () => {
      mockRepo.findOne.mockResolvedValue({ value: 'enc', expiresAt: new Date('2020-01-01') });
      mockRepo.remove.mockResolvedValue({});
      expect(await service.get('ns', 'k')).toBeNull();
      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it('returns value when not expired', async () => {
      mockRepo.findOne.mockResolvedValue({ value: 'enc', expiresAt: new Date(Date.now() + 60000) });
      expect(await service.get('ns', 'k')).toBe('decrypted');
    });
  });

  describe('has', () => {
    it('returns false when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.has('ns', 'k')).toBe(false);
    });

    it('returns false when expired', async () => {
      mockRepo.findOne.mockResolvedValue({ expiresAt: new Date('2020-01-01') });
      expect(await service.has('ns', 'k')).toBe(false);
    });

    it('returns true when valid', async () => {
      mockRepo.findOne.mockResolvedValue({ expiresAt: null });
      expect(await service.has('ns', 'k')).toBe(true);
    });
  });

  describe('delete', () => {
    it('returns true when deleted', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      expect(await service.delete('ns', 'k')).toBe(true);
    });

    it('returns false when not found', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0 });
      expect(await service.delete('ns', 'k')).toBe(false);
    });
  });

  describe('deleteNamespace', () => {
    it('returns count', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 5 });
      expect(await service.deleteNamespace('ns')).toBe(5);
    });

    it('returns 0 when null', async () => {
      mockRepo.delete.mockResolvedValue({ affected: null });
      expect(await service.deleteNamespace('ns')).toBe(0);
    });
  });

  describe('purgeExpired', () => {
    it('returns purged count', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 3 });
      expect(await service.purgeExpired()).toBe(3);
    });

    it('returns 0 when nothing expired', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0 });
      expect(await service.purgeExpired()).toBe(0);
    });
  });
});
