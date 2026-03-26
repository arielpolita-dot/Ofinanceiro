import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompanyService } from '../company.service';
import { CompanyRole } from '../../../database/entities/company-role.enum';

const mockCompanyRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

const mockMemberService = {
  addMember: jest.fn(),
  getMembers: jest.fn(),
  isMember: jest.fn(),
};

const mockMemberRepo = {
  find: jest.fn(),
};

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(() => {
    service = new CompanyService(
      mockCompanyRepo as any,
      mockMemberRepo as any,
      mockMemberService as any,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a company and add owner as member', async () => {
      const company = { id: 'c1', name: 'Acme', slug: 'acme', ownerId: 'u1' };
      mockCompanyRepo.findOne.mockResolvedValue(null);
      mockCompanyRepo.create.mockReturnValue(company);
      mockCompanyRepo.save.mockResolvedValue(company);
      mockMemberService.addMember.mockResolvedValue({});

      const result = await service.create('u1', { name: 'Acme' });

      expect(result).toEqual(company);
      expect(mockMemberService.addMember).toHaveBeenCalledWith(
        'c1', 'u1', CompanyRole.OWNER,
      );
    });

    it('should generate unique slug on conflict', async () => {
      mockCompanyRepo.findOne
        .mockResolvedValueOnce({ slug: 'acme' })    // first slug exists
        .mockResolvedValueOnce(null);                 // acme-1 does not exist
      const company = { id: 'c1', name: 'Acme', slug: 'acme-1', ownerId: 'u1' };
      mockCompanyRepo.create.mockReturnValue(company);
      mockCompanyRepo.save.mockResolvedValue(company);
      mockMemberService.addMember.mockResolvedValue({});

      const result = await service.create('u1', { name: 'Acme' });

      expect(result.slug).toBe('acme-1');
    });
  });

  describe('findAllByUser', () => {
    it('should return companies the user is a member of', async () => {
      const memberships = [
        { companyId: 'c1', role: CompanyRole.OWNER, company: { id: 'c1', name: 'Acme' } },
      ];
      mockMemberRepo.find.mockResolvedValue(memberships);

      const result = await service.findAllByUser('u1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'c1',
        name: 'Acme',
        role: CompanyRole.OWNER,
      });
    });
  });

  describe('findById', () => {
    it('should return company if found', async () => {
      const company = { id: 'c1', name: 'Acme' };
      mockCompanyRepo.findOne.mockResolvedValue(company);

      const result = await service.findById('c1');

      expect(result).toEqual(company);
    });

    it('should throw NotFoundException if not found', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('c1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update company fields', async () => {
      const company = { id: 'c1', name: 'Acme', description: null };
      mockCompanyRepo.findOne.mockResolvedValue(company);
      mockCompanyRepo.save.mockResolvedValue({ ...company, name: 'Acme Inc' });

      const result = await service.update('c1', { name: 'Acme Inc' });

      expect(result.name).toBe('Acme Inc');
    });

    it('should throw NotFoundException if company not found', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.update('c1', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove company', async () => {
      const company = { id: 'c1' };
      mockCompanyRepo.findOne.mockResolvedValue(company);

      await service.delete('c1');

      expect(mockCompanyRepo.remove).toHaveBeenCalledWith(company);
    });

    it('should throw NotFoundException if not found', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('c1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from name', () => {
      expect(service.generateSlug('My Company')).toBe('my-company');
    });

    it('should handle special characters', () => {
      expect(service.generateSlug('Cafe & Bar!')).toBe('cafe-bar');
    });

    it('should handle accented characters', () => {
      expect(service.generateSlug('Empresa Brasil')).toBe('empresa-brasil');
    });
  });

  describe('count', () => {
    it('should return the count of user companies', async () => {
      mockMemberRepo.find.mockResolvedValue([{ companyId: 'c1' }, { companyId: 'c2' }]);

      const result = await service.count('u1');

      expect(result).toBe(2);
    });
  });
});
