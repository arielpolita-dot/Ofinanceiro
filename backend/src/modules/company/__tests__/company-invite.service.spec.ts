import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CompanyInviteService } from '../company-invite.service';
import { CompanyRole } from '../../../database/entities/company-role.enum';
import { InviteStatus } from '../../../database/entities/company-invite.entity';

const mockInviteRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockMemberService = {
  addMember: jest.fn(),
  isMember: jest.fn(),
};

const mockEmailService = {
  sendCompanyInviteEmail: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'FRONTEND_URL') return 'https://app.test.com';
    return undefined;
  }),
};

function buildService() {
  return new CompanyInviteService(
    mockInviteRepo as any,
    mockMemberService as any,
    mockEmailService as any,
    mockConfigService as any,
  );
}

describe('CompanyInviteService', () => {
  let service: CompanyInviteService;

  beforeEach(() => {
    service = buildService();
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('should create a pending invite and send email', async () => {
      mockMemberService.isMember.mockResolvedValue(false);
      mockInviteRepo.findOne.mockResolvedValue(null);
      const invite = {
        id: 'inv-1', companyId: 'c1', email: 'new@test.com',
        role: CompanyRole.MEMBER, status: InviteStatus.PENDING,
      };
      mockInviteRepo.create.mockReturnValue(invite);
      mockInviteRepo.save.mockResolvedValue(invite);
      mockEmailService.sendCompanyInviteEmail.mockResolvedValue(true);

      const result = await service.createInvite(
        'c1', 'new@test.com', CompanyRole.MEMBER, 'u1', 'Acme Corp', 'John',
      );

      expect(result.status).toBe(InviteStatus.PENDING);
      expect(mockInviteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'c1',
          email: 'new@test.com',
          role: CompanyRole.MEMBER,
          invitedBy: 'u1',
          status: InviteStatus.PENDING,
        }),
      );
      expect(mockEmailService.sendCompanyInviteEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if pending invite already exists', async () => {
      mockMemberService.isMember.mockResolvedValue(false);
      mockInviteRepo.findOne.mockResolvedValue({
        id: 'inv-1', status: InviteStatus.PENDING,
      });

      await expect(
        service.createInvite('c1', 'dup@test.com', CompanyRole.MEMBER, 'u1', 'Acme', 'John'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      mockMemberService.isMember.mockResolvedValue(true);

      await expect(
        service.createInvite('c1', 'exists@test.com', CompanyRole.MEMBER, 'u1', 'Acme', 'John'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPendingInvites', () => {
    it('should return pending invites for a company', async () => {
      const invites = [
        { id: 'inv-1', email: 'a@b.com', status: InviteStatus.PENDING },
      ];
      mockInviteRepo.find.mockResolvedValue(invites);

      const result = await service.getPendingInvites('c1');

      expect(result).toEqual(invites);
      expect(mockInviteRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'c1', status: InviteStatus.PENDING },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('acceptInvite', () => {
    it('should accept a valid invite and create member', async () => {
      const invite = {
        id: 'inv-1', companyId: 'c1', email: 'a@b.com',
        role: CompanyRole.MEMBER, status: InviteStatus.PENDING,
        invitedBy: 'u1',
        expiresAt: new Date(Date.now() + 86400000),
      };
      mockInviteRepo.findOne.mockResolvedValue(invite);
      mockMemberService.addMember.mockResolvedValue({});
      mockInviteRepo.save.mockResolvedValue({
        ...invite, status: InviteStatus.ACCEPTED,
      });

      const result = await service.acceptInvite('token-123', 'u2');

      expect(result.status).toBe(InviteStatus.ACCEPTED);
      expect(mockMemberService.addMember).toHaveBeenCalledWith(
        'c1', 'u2', CompanyRole.MEMBER, 'u1',
      );
    });

    it('should throw NotFoundException for invalid token', async () => {
      mockInviteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.acceptInvite('bad-token', 'u2'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired invite', async () => {
      const invite = {
        id: 'inv-1', status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000),
      };
      mockInviteRepo.findOne.mockResolvedValue(invite);

      await expect(
        service.acceptInvite('expired-token', 'u2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-pending invite', async () => {
      const invite = {
        id: 'inv-1', status: InviteStatus.CANCELED,
        expiresAt: new Date(Date.now() + 86400000),
      };
      mockInviteRepo.findOne.mockResolvedValue(invite);

      await expect(
        service.acceptInvite('canceled-token', 'u2'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptPendingInvitesForEmail', () => {
    it('should accept all pending invites for an email', async () => {
      const invites = [
        {
          id: 'inv-1', companyId: 'c1', email: 'a@b.com',
          role: CompanyRole.MEMBER, status: InviteStatus.PENDING,
          invitedBy: 'u1',
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'inv-2', companyId: 'c2', email: 'a@b.com',
          role: CompanyRole.ADMIN, status: InviteStatus.PENDING,
          invitedBy: 'u3',
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
      mockInviteRepo.find.mockResolvedValue(invites);
      mockMemberService.addMember.mockResolvedValue({});
      mockInviteRepo.save.mockImplementation((inv: any) => Promise.resolve(inv));

      const count = await service.acceptPendingInvitesForEmail('a@b.com', 'u2');

      expect(count).toBe(2);
      expect(mockMemberService.addMember).toHaveBeenCalledTimes(2);
    });

    it('should skip expired invites', async () => {
      const invites = [
        {
          id: 'inv-1', companyId: 'c1', email: 'a@b.com',
          role: CompanyRole.MEMBER, status: InviteStatus.PENDING,
          invitedBy: 'u1',
          expiresAt: new Date(Date.now() - 86400000), // expired
        },
      ];
      mockInviteRepo.find.mockResolvedValue(invites);
      mockInviteRepo.save.mockImplementation((inv: any) => Promise.resolve(inv));

      const count = await service.acceptPendingInvitesForEmail('a@b.com', 'u2');

      expect(count).toBe(0);
      expect(mockMemberService.addMember).not.toHaveBeenCalled();
    });

    it('should return 0 when no pending invites', async () => {
      mockInviteRepo.find.mockResolvedValue([]);

      const count = await service.acceptPendingInvitesForEmail('none@test.com', 'u2');

      expect(count).toBe(0);
    });
  });

  describe('cancelInvite', () => {
    it('should cancel a pending invite', async () => {
      const invite = { id: 'inv-1', status: InviteStatus.PENDING };
      mockInviteRepo.findOne.mockResolvedValue(invite);
      mockInviteRepo.save.mockResolvedValue({
        ...invite, status: InviteStatus.CANCELED,
      });

      await service.cancelInvite('inv-1', 'c1');

      expect(mockInviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InviteStatus.CANCELED }),
      );
    });

    it('should throw NotFoundException for invalid invite', async () => {
      mockInviteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelInvite('bad-id', 'c1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-pending invite', async () => {
      const invite = { id: 'inv-1', status: InviteStatus.ACCEPTED };
      mockInviteRepo.findOne.mockResolvedValue(invite);

      await expect(
        service.cancelInvite('inv-1', 'c1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInviteInfo', () => {
    it('should return invite info', async () => {
      mockInviteRepo.findOne.mockResolvedValue({
        token: 'tok-1',
        email: 'test@test.com',
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        company: { name: 'Acme' },
        inviter: { name: 'Diego', email: 'diego@test.com' },
      });

      const info = await service.getInviteInfo('tok-1');
      expect(info.companyName).toBe('Acme');
      expect(info.inviterName).toBe('Diego');
      expect(info.email).toBe('test@test.com');
      expect(info.status).toBe(InviteStatus.PENDING);
    });

    it('should throw when invite not found', async () => {
      mockInviteRepo.findOne.mockResolvedValue(null);
      await expect(service.getInviteInfo('bad-tok')).rejects.toThrow(NotFoundException);
    });

    it('should return EXPIRED status for expired pending invite', async () => {
      mockInviteRepo.findOne.mockResolvedValue({
        token: 'tok-2',
        email: 'test@test.com',
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000),
        company: { name: 'Acme' },
        inviter: { name: 'Diego' },
      });

      const info = await service.getInviteInfo('tok-2');
      expect(info.status).toBe(InviteStatus.EXPIRED);
    });

    it('should return original status for non-pending expired', async () => {
      mockInviteRepo.findOne.mockResolvedValue({
        token: 'tok-3',
        email: 'test@test.com',
        status: InviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() - 1000),
        company: { name: 'Acme' },
        inviter: { email: 'diego@test.com' },
      });

      const info = await service.getInviteInfo('tok-3');
      expect(info.status).toBe(InviteStatus.ACCEPTED);
      expect(info.inviterName).toBe('diego@test.com');
    });

    it('should handle null company/inviter gracefully', async () => {
      mockInviteRepo.findOne.mockResolvedValue({
        token: 'tok-4',
        email: 'test@test.com',
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        company: null,
        inviter: null,
      });

      const info = await service.getInviteInfo('tok-4');
      expect(info.companyName).toBe('Unknown');
      expect(info.inviterName).toBe('Unknown');
    });
  });

  describe('isExpired', () => {
    it('should return true for past date', () => {
      const invite = { expiresAt: new Date(Date.now() - 1000) } as any;
      expect(service.isExpired(invite)).toBe(true);
    });

    it('should return false for future date', () => {
      const invite = { expiresAt: new Date(Date.now() + 86400000) } as any;
      expect(service.isExpired(invite)).toBe(false);
    });
  });
});
