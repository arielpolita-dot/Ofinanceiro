import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../database/entities/company.entity';
import { CompanyMember } from '../../database/entities/company-member.entity';
import { CompanyRole } from '../../database/entities/company-role.enum';
import { CompanyMemberService } from './company-member.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

export interface CompanyWithRole {
  id: string;
  name: string;
  role: CompanyRole;
  [key: string]: unknown;
}

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyMember)
    private readonly memberRepository: Repository<CompanyMember>,
    private readonly memberService: CompanyMemberService,
  ) {}

  async create(ownerId: string, dto: CreateCompanyDto): Promise<Company> {
    const slug = await this.findUniqueSlug(dto.name);

    const company = this.companyRepository.create({
      ownerId,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      website: dto.website ?? null,
      industry: dto.industry ?? null,
    });

    const saved = await this.companyRepository.save(company);
    await this.memberService.addMember(saved.id, ownerId, CompanyRole.OWNER);
    return saved;
  }

  async findAllByUser(userId: string): Promise<CompanyWithRole[]> {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['company'],
    });

    return memberships.map((m) => ({
      ...m.company,
      id: m.companyId,
      name: m.company.name,
      role: m.role,
    }));
  }

  async findById(companyId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(companyId: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findById(companyId);
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async delete(companyId: string): Promise<void> {
    const company = await this.findById(companyId);
    await this.companyRepository.remove(company);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async count(userId: string): Promise<number> {
    const memberships = await this.memberRepository.find({
      where: { userId },
    });
    return memberships.length;
  }

  private async findUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 0;

    while (await this.slugExists(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private async slugExists(slug: string): Promise<boolean> {
    const existing = await this.companyRepository.findOne({
      where: { slug },
    });
    return !!existing;
  }
}
