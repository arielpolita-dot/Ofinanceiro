import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSyncService, INVITE_ACCEPTOR } from '../user-sync.service';
import { AdminUser } from '../../../database/entities/admin-user.entity';
import { AuthUser } from '../auth-bff.types';

describe('UserSyncService', () => {
  let service: UserSyncService;

  const mockRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockInviteAcceptor = {
    acceptPendingInvitesForEmail: jest.fn(),
  };

  const authUser: AuthUser = {
    id: 'auth-123',
    email: 'test@example.com',
    name: 'Test User',
  } as AuthUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UserSyncService,
        { provide: getRepositoryToken(AdminUser), useValue: mockRepo },
        { provide: INVITE_ACCEPTOR, useValue: mockInviteAcceptor },
      ],
    }).compile();

    service = module.get(UserSyncService);
  });

  it('should create new user when not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockReturnValue({ id: authUser.id });
    mockRepo.save.mockResolvedValue({ id: authUser.id });
    mockInviteAcceptor.acceptPendingInvitesForEmail.mockResolvedValue(0);

    await service.ensureLocalUser(authUser);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'auth-123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    );
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should update existing user when found by id', async () => {
    const existing = { id: 'auth-123', email: 'old@example.com', name: 'Old' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockInviteAcceptor.acceptPendingInvitesForEmail.mockResolvedValue(0);

    await service.ensureLocalUser(authUser);

    expect(mockRepo.update).toHaveBeenCalledWith(
      'auth-123',
      expect.objectContaining({ email: 'test@example.com' }),
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should handle email mismatch by updating local user', async () => {
    const localUser = { id: 'local-456', email: 'test@example.com', name: 'Local' };
    mockRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(localUser);
    mockInviteAcceptor.acceptPendingInvitesForEmail.mockResolvedValue(0);

    await service.ensureLocalUser(authUser);

    expect(mockRepo.update).toHaveBeenCalledWith(
      'local-456',
      expect.objectContaining({ name: 'Test User' }),
    );
    expect(authUser.id).toBe('local-456');
  });

  it('should accept pending invites after sync', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockReturnValue({ id: 'new-789' });
    mockRepo.save.mockResolvedValue({ id: 'new-789' });
    mockInviteAcceptor.acceptPendingInvitesForEmail.mockResolvedValue(2);

    await service.ensureLocalUser({ ...authUser, id: 'new-789' } as AuthUser);

    expect(mockInviteAcceptor.acceptPendingInvitesForEmail).toHaveBeenCalledWith(
      'test@example.com', 'new-789',
    );
  });

  it('should not fail if invite acceptor throws', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'auth-123', email: 'test@example.com', name: 'Test' });
    mockInviteAcceptor.acceptPendingInvitesForEmail.mockRejectedValue(new Error('DB error'));

    // Should not throw
    await service.ensureLocalUser(authUser);

    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should throw and log on repository error', async () => {
    mockRepo.findOne.mockRejectedValue(new Error('DB down'));

    await expect(service.ensureLocalUser(authUser)).rejects.toThrow('DB down');
  });
});
