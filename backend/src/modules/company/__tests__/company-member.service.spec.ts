import { CompanyMemberService } from '../company-member.service';
import { CompanyRole } from '../../../database/entities/company-role.enum';

const mockMemberRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('CompanyMemberService', () => {
  let service: CompanyMemberService;

  beforeEach(() => {
    service = new CompanyMemberService(mockMemberRepo as any);
    jest.clearAllMocks();
  });

  describe('addMember', () => {
    it('should create and save a new company member', async () => {
      const member = { id: 'm1', companyId: 'c1', userId: 'u1', role: CompanyRole.MEMBER };
      mockMemberRepo.create.mockReturnValue(member);
      mockMemberRepo.save.mockResolvedValue(member);

      const result = await service.addMember('c1', 'u1', CompanyRole.MEMBER, 'inviter1');

      expect(mockMemberRepo.create).toHaveBeenCalledWith({
        companyId: 'c1',
        userId: 'u1',
        role: CompanyRole.MEMBER,
        invitedBy: 'inviter1',
      });
      expect(mockMemberRepo.save).toHaveBeenCalledWith(member);
      expect(result).toEqual(member);
    });
  });

  describe('removeMember', () => {
    it('should remove existing member', async () => {
      const member = { id: 'm1', companyId: 'c1', userId: 'u1' };
      mockMemberRepo.findOne.mockResolvedValue(member);

      await service.removeMember('c1', 'u1');

      expect(mockMemberRepo.remove).toHaveBeenCalledWith(member);
    });

    it('should do nothing if member not found', async () => {
      mockMemberRepo.findOne.mockResolvedValue(null);

      await service.removeMember('c1', 'u1');

      expect(mockMemberRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should update member role', async () => {
      const member = { id: 'm1', role: CompanyRole.MEMBER };
      mockMemberRepo.findOne.mockResolvedValue(member);
      mockMemberRepo.save.mockResolvedValue({ ...member, role: CompanyRole.ADMIN });

      const result = await service.updateRole('c1', 'u1', CompanyRole.ADMIN);

      expect(result?.role).toBe(CompanyRole.ADMIN);
    });

    it('should return null if member not found', async () => {
      mockMemberRepo.findOne.mockResolvedValue(null);

      const result = await service.updateRole('c1', 'u1', CompanyRole.ADMIN);

      expect(result).toBeNull();
    });
  });

  describe('getMemberRole', () => {
    it('should return member role', async () => {
      mockMemberRepo.findOne.mockResolvedValue({ role: CompanyRole.OWNER });

      const result = await service.getMemberRole('c1', 'u1');

      expect(result).toBe(CompanyRole.OWNER);
    });

    it('should return null if not a member', async () => {
      mockMemberRepo.findOne.mockResolvedValue(null);

      const result = await service.getMemberRole('c1', 'u1');

      expect(result).toBeNull();
    });
  });

  describe('isMember', () => {
    it('should return true if user is a member', async () => {
      mockMemberRepo.findOne.mockResolvedValue({ id: 'm1' });

      expect(await service.isMember('c1', 'u1')).toBe(true);
    });

    it('should return false if user is not a member', async () => {
      mockMemberRepo.findOne.mockResolvedValue(null);

      expect(await service.isMember('c1', 'u1')).toBe(false);
    });
  });

  describe('getMembers', () => {
    it('should return all members with user relation', async () => {
      const members = [
        { id: 'm1', userId: 'u1', role: CompanyRole.OWNER, user: { email: 'a@b.com' } },
      ];
      mockMemberRepo.find.mockResolvedValue(members);

      const result = await service.getMembers('c1');

      expect(mockMemberRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'c1' },
        relations: ['user'],
        order: { joinedAt: 'ASC' },
      });
      expect(result).toEqual(members);
    });
  });
});
