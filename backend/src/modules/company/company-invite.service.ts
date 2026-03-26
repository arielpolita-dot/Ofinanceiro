import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CompanyInvite, InviteStatus } from '../../database/entities/company-invite.entity';
import { CompanyRole } from '../../database/entities/company-role.enum';
import { CompanyMemberService } from './company-member.service';
import { EmailService } from '../../common/services/email.service';

/** Default invite expiration: 7 days in milliseconds */
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class CompanyInviteService {
  private readonly logger = new Logger(CompanyInviteService.name);

  constructor(
    @InjectRepository(CompanyInvite)
    private readonly inviteRepository: Repository<CompanyInvite>,
    private readonly memberService: CompanyMemberService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createInvite(
    companyId: string,
    email: string,
    role: CompanyRole,
    invitedById: string,
    companyName: string,
    inviterName: string,
  ): Promise<CompanyInvite> {
    const normalizedEmail = email.toLowerCase().trim();

    await this.validateNoExistingMembership(companyId, normalizedEmail);
    await this.validateNoPendingInvite(companyId, normalizedEmail);

    const invite = this.buildInvite(companyId, normalizedEmail, role, invitedById);
    const saved = await this.inviteRepository.save(invite);

    await this.sendInviteEmail(normalizedEmail, companyName, inviterName, saved.token);

    return saved;
  }

  async getPendingInvites(companyId: string): Promise<CompanyInvite[]> {
    return this.inviteRepository.find({
      where: { companyId, status: InviteStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async acceptInvite(token: string, userId: string): Promise<CompanyInvite> {
    const invite = await this.findByToken(token);
    this.validateAcceptable(invite);

    await this.memberService.addMember(
      invite.companyId, userId, invite.role, invite.invitedBy,
    );

    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedAt = new Date();
    return this.inviteRepository.save(invite);
  }

  async acceptPendingInvitesForEmail(email: string, userId: string): Promise<number> {
    const invites = await this.inviteRepository.find({
      where: { email: email.toLowerCase(), status: InviteStatus.PENDING },
    });

    let accepted = 0;
    for (const invite of invites) {
      if (this.isExpired(invite)) {
        invite.status = InviteStatus.EXPIRED;
        await this.inviteRepository.save(invite);
        continue;
      }

      await this.memberService.addMember(
        invite.companyId, userId, invite.role, invite.invitedBy,
      );
      invite.status = InviteStatus.ACCEPTED;
      invite.acceptedAt = new Date();
      await this.inviteRepository.save(invite);
      accepted++;
    }

    if (accepted > 0) {
      this.logger.log(`Auto-accepted ${accepted} invite(s) for ${email}`);
    }
    return accepted;
  }

  async cancelInvite(inviteId: string, companyId: string): Promise<void> {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId, companyId },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be canceled');
    }

    invite.status = InviteStatus.CANCELED;
    await this.inviteRepository.save(invite);
  }

  async getInviteInfo(token: string): Promise<{
    companyName: string;
    inviterName: string;
    email: string;
    status: InviteStatus;
    expiresAt: Date;
  }> {
    const invite = await this.inviteRepository.findOne({
      where: { token },
      relations: ['company', 'inviter'],
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const status = this.isExpired(invite) && invite.status === InviteStatus.PENDING
      ? InviteStatus.EXPIRED
      : invite.status;

    return {
      companyName: invite.company?.name ?? 'Unknown',
      inviterName: invite.inviter?.name ?? invite.inviter?.email ?? 'Unknown',
      email: invite.email,
      status,
      expiresAt: invite.expiresAt,
    };
  }

  isExpired(invite: CompanyInvite): boolean {
    return new Date() > invite.expiresAt;
  }

  private async validateNoExistingMembership(companyId: string, email: string): Promise<void> {
    const isMember = await this.memberService.isMember(companyId, email);
    if (isMember) {
      throw new ConflictException('User is already a member of this company');
    }
  }

  private async validateNoPendingInvite(companyId: string, email: string): Promise<void> {
    const existing = await this.inviteRepository.findOne({
      where: { companyId, email, status: InviteStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('A pending invite already exists for this email');
    }
  }

  private buildInvite(
    companyId: string, email: string, role: CompanyRole, invitedBy: string,
  ): CompanyInvite {
    return this.inviteRepository.create({
      companyId,
      email,
      role,
      invitedBy,
      token: randomUUID(),
      status: InviteStatus.PENDING,
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    });
  }

  private async sendInviteEmail(
    to: string, companyName: string, inviterName: string, token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const acceptUrl = `${frontendUrl}/invite/${token}`;

    await this.emailService.sendCompanyInviteEmail(to, companyName, inviterName, acceptUrl);
  }

  private async findByToken(token: string): Promise<CompanyInvite> {
    const invite = await this.inviteRepository.findOne({ where: { token } });
    if (!invite) {
      throw new NotFoundException('Invite not found or invalid token');
    }
    return invite;
  }

  private validateAcceptable(invite: CompanyInvite): void {
    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('This invite is no longer valid');
    }
    if (this.isExpired(invite)) {
      invite.status = InviteStatus.EXPIRED;
      throw new BadRequestException('This invite has expired');
    }
  }
}
