import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyController } from '../company.controller';
import { CompanyRole } from '../../../database/entities/company-role.enum';
import { InviteStatus } from '../../../database/entities/company-invite.entity';

const mockCompanyService = {
  create: jest.fn(),
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockMemberService = {
  getMembers: jest.fn(),
  addMember: jest.fn(),
  updateRole: jest.fn(),
  removeMember: jest.fn(),
  getMemberRole: jest.fn(),
};

const mockInviteService = {
  createInvite: jest.fn(),
  getPendingInvites: jest.fn(),
  cancelInvite: jest.fn(),
};

const mockUserRepo = {
  findOne: jest.fn(),
};

function mockRequest(user: any = { id: 'u1', email: 'a@b.com', name: 'Test' }) {
  return { user } as any;
}

describe('CompanyController', () => {
  let controller: CompanyController;

  beforeEach(() => {
    controller = new CompanyController(
      mockCompanyService as any,
      mockMemberService as any,
      mockInviteService as any,
      mockUserRepo as any,
    );
    jest.clearAllMocks();
  });

  describe('GET /companies', () => {
    it('should return user companies', async () => {
      const companies = [{ id: 'c1', name: 'Acme', role: 'owner' }];
      mockCompanyService.findAllByUser.mockResolvedValue(companies);

      const result = await controller.findAll(mockRequest());

      expect(result).toEqual(companies);
      expect(mockCompanyService.findAllByUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('POST /companies', () => {
    it('should create a company', async () => {
      const company = { id: 'c1', name: 'Acme', slug: 'acme' };
      mockCompanyService.create.mockResolvedValue(company);

      const result = await controller.create(
        mockRequest(),
        { name: 'Acme' },
      );

      expect(result).toEqual(company);
      expect(mockCompanyService.create).toHaveBeenCalledWith('u1', { name: 'Acme' });
    });
  });

  describe('GET /companies/:id', () => {
    it('should return company details', async () => {
      const company = { id: 'c1', name: 'Acme' };
      mockCompanyService.findById.mockResolvedValue(company);

      const result = await controller.findOne('c1');

      expect(result).toEqual(company);
    });
  });

  describe('PATCH /companies/:id', () => {
    it('should update company', async () => {
      const updated = { id: 'c1', name: 'Acme Inc' };
      mockCompanyService.update.mockResolvedValue(updated);

      const result = await controller.update('c1', { name: 'Acme Inc' });

      expect(result).toEqual(updated);
    });
  });

  describe('DELETE /companies/:id', () => {
    it('should delete company', async () => {
      mockCompanyService.delete.mockResolvedValue(undefined);

      await controller.remove('c1');

      expect(mockCompanyService.delete).toHaveBeenCalledWith('c1');
    });
  });

  describe('GET /companies/:id/members', () => {
    it('should return company members', async () => {
      const members = [{ id: 'm1', userId: 'u1', role: 'owner' }];
      mockMemberService.getMembers.mockResolvedValue(members);

      const result = await controller.getMembers('c1');

      expect(result).toEqual(members);
    });
  });

  describe('POST /companies/:id/members', () => {
    it('should add existing user directly and return status added', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u2' });
      const member = { id: 'm2', userId: 'u2', role: CompanyRole.MEMBER };
      mockMemberService.addMember.mockResolvedValue(member);

      const result = await controller.inviteMember(
        'c1',
        { email: 'existing@test.com', role: CompanyRole.MEMBER },
        mockRequest(),
      );

      expect(result.status).toBe('added');
      expect(result.member).toEqual(member);
      expect(mockInviteService.createInvite).not.toHaveBeenCalled();
    });

    it('should create invite for unknown user and return status invited', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockCompanyService.findById.mockResolvedValue({ id: 'c1', name: 'Acme' });
      const invite = {
        id: 'inv-1', email: 'new@test.com',
        status: InviteStatus.PENDING, role: CompanyRole.MEMBER,
      };
      mockInviteService.createInvite.mockResolvedValue(invite);

      const result = await controller.inviteMember(
        'c1',
        { email: 'new@test.com', role: CompanyRole.MEMBER },
        mockRequest(),
      );

      expect(result.status).toBe('invited');
      expect(result.invite).toEqual(invite);
      expect(mockMemberService.addMember).not.toHaveBeenCalled();
    });
  });

  describe('GET /companies/:id/invites', () => {
    it('should return pending invites', async () => {
      const invites = [{ id: 'inv-1', email: 'a@b.com', status: InviteStatus.PENDING }];
      mockInviteService.getPendingInvites.mockResolvedValue(invites);

      const result = await controller.getInvites('c1');

      expect(result).toEqual(invites);
    });
  });

  describe('DELETE /companies/:id/invites/:inviteId', () => {
    it('should cancel an invite', async () => {
      mockInviteService.cancelInvite.mockResolvedValue(undefined);

      await controller.cancelInvite('c1', 'inv-1');

      expect(mockInviteService.cancelInvite).toHaveBeenCalledWith('inv-1', 'c1');
    });
  });

  describe('PATCH /companies/:id/members/:userId', () => {
    it('should update member role', async () => {
      const updated = { id: 'm1', role: CompanyRole.ADMIN };
      mockMemberService.updateRole.mockResolvedValue(updated);

      const result = await controller.updateMemberRole(
        'c1', 'u2',
        { role: CompanyRole.ADMIN },
      );

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockMemberService.updateRole.mockResolvedValue(null);

      await expect(
        controller.updateMemberRole('c1', 'u2', { role: CompanyRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /companies/:id/members/:userId', () => {
    it('should remove a member', async () => {
      mockMemberService.removeMember.mockResolvedValue(undefined);

      await controller.removeMember('c1', 'u2');

      expect(mockMemberService.removeMember).toHaveBeenCalledWith('c1', 'u2');
    });
  });

  describe('POST /companies/:id/switch', () => {
    it('should verify membership and return company', async () => {
      mockMemberService.getMemberRole.mockResolvedValue(CompanyRole.OWNER);
      mockCompanyService.findById.mockResolvedValue({ id: 'c1', name: 'Acme' });

      const result = await controller.switchCompany('c1', mockRequest());

      expect(result).toEqual({
        activeCompanyId: 'c1',
        company: { id: 'c1', name: 'Acme' },
      });
    });

    it('should throw ForbiddenException if not a member', async () => {
      mockMemberService.getMemberRole.mockResolvedValue(null);

      await expect(
        controller.switchCompany('c1', mockRequest()),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
