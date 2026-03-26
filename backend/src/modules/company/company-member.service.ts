import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyMember } from '../../database/entities/company-member.entity';
import { CompanyRole } from '../../database/entities/company-role.enum';

@Injectable()
export class CompanyMemberService {
  constructor(
    @InjectRepository(CompanyMember)
    private readonly memberRepository: Repository<CompanyMember>,
  ) {}

  async addMember(
    companyId: string,
    userId: string,
    role: CompanyRole,
    invitedBy?: string,
  ): Promise<CompanyMember> {
    const member = this.memberRepository.create({
      companyId,
      userId,
      role,
      invitedBy: invitedBy ?? null,
    });
    return this.memberRepository.save(member);
  }

  async removeMember(companyId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { companyId, userId },
    });
    if (member) {
      await this.memberRepository.remove(member);
    }
  }

  async updateRole(
    companyId: string,
    userId: string,
    role: CompanyRole,
  ): Promise<CompanyMember | null> {
    const member = await this.memberRepository.findOne({
      where: { companyId, userId },
    });
    if (!member) return null;

    member.role = role;
    return this.memberRepository.save(member);
  }

  async getMemberRole(companyId: string, userId: string): Promise<CompanyRole | null> {
    const member = await this.memberRepository.findOne({
      where: { companyId, userId },
    });
    return member?.role ?? null;
  }

  async isMember(companyId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { companyId, userId },
    });
    return !!member;
  }

  async getMembers(companyId: string): Promise<CompanyMember[]> {
    return this.memberRepository.find({
      where: { companyId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }
}
