import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InviteAcceptController } from '../invite-accept.controller';
import { InviteStatus } from '../../../database/entities/company-invite.entity';
import { CompanyRole } from '../../../database/entities/company-role.enum';

const mockInviteService = {
  acceptInvite: jest.fn(),
  getInviteInfo: jest.fn(),
};

const mockUserRepo = {
  findOne: jest.fn(),
};

describe('InviteAcceptController', () => {
  let controller: InviteAcceptController;

  beforeEach(() => {
    controller = new InviteAcceptController(
      mockInviteService as any,
      mockUserRepo as any,
    );
    jest.clearAllMocks();
  });

  describe('POST /companies/invites/:token/accept', () => {
    it('should accept invite for authenticated user', async () => {
      const req = { user: { id: 'u1', email: 'a@b.com' } } as any;
      const accepted = {
        id: 'inv-1', status: InviteStatus.ACCEPTED,
        companyId: 'c1', role: CompanyRole.MEMBER,
      };
      mockInviteService.acceptInvite.mockResolvedValue(accepted);

      const result = await controller.acceptInvite('token-123', req);

      expect(result).toEqual({
        status: 'accepted',
        companyId: 'c1',
        role: CompanyRole.MEMBER,
      });
      expect(mockInviteService.acceptInvite).toHaveBeenCalledWith('token-123', 'u1');
    });

    it('should throw NotFoundException for invalid token', async () => {
      const req = { user: { id: 'u1', email: 'a@b.com' } } as any;
      mockInviteService.acceptInvite.mockRejectedValue(
        new NotFoundException('Invite not found'),
      );

      await expect(
        controller.acceptInvite('bad-token', req),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired invite', async () => {
      const req = { user: { id: 'u1', email: 'a@b.com' } } as any;
      mockInviteService.acceptInvite.mockRejectedValue(
        new BadRequestException('Invite has expired'),
      );

      await expect(
        controller.acceptInvite('expired-token', req),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /companies/invites/:token/info', () => {
    it('should return invite info without auth', async () => {
      mockInviteService.getInviteInfo.mockResolvedValue({
        companyName: 'Acme Corp',
        inviterName: 'John',
        email: 'a@b.com',
        status: InviteStatus.PENDING,
        expiresAt: new Date('2030-01-01'),
      });

      const result = await controller.getInviteInfo('token-123');

      expect(result).toEqual(expect.objectContaining({
        companyName: 'Acme Corp',
      }));
      expect(mockInviteService.getInviteInfo).toHaveBeenCalledWith('token-123');
    });
  });
});
