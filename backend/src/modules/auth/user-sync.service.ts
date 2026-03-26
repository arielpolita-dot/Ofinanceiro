import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { AuthUser } from './auth-bff.types';

/** Interface to avoid circular dependency with CompanyInviteService */
export interface InviteAcceptor {
  acceptPendingInvitesForEmail(email: string, userId: string): Promise<number>;
}

export const INVITE_ACCEPTOR = 'INVITE_ACCEPTOR';

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @Optional() @Inject(INVITE_ACCEPTOR)
    private readonly inviteAcceptor?: InviteAcceptor,
  ) {}

  async ensureLocalUser(authUser: AuthUser): Promise<void> {
    try {
      await this.syncUserRecord(authUser);
      await this.acceptPendingInvites(authUser);
    } catch (error) {
      this.logger.error(`ERROR | ${error instanceof Error ? error.message : error} | id=${authUser.id}`);
      throw error;
    }
  }

  private async acceptPendingInvites(authUser: AuthUser): Promise<void> {
    if (!this.inviteAcceptor) return;

    try {
      const accepted = await this.inviteAcceptor.acceptPendingInvitesForEmail(
        authUser.email.toLowerCase(), authUser.id,
      );
      if (accepted > 0) {
        this.logger.log(`Auto-accepted ${accepted} invite(s) for ${authUser.email}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to accept pending invites for ${authUser.email}: ${(error as Error).message}`);
    }
  }

  private async syncUserRecord(authUser: AuthUser): Promise<void> {
    let existingUser = await this.adminUserRepository.findOne({
      where: { id: authUser.id },
    });

    if (!existingUser) {
      existingUser = await this.handleEmailMismatch(authUser);
    }

    if (existingUser) {
      await this.updateExistingUser(existingUser, authUser);
      return;
    }

    await this.createNewUser(authUser);
  }

  private async handleEmailMismatch(authUser: AuthUser): Promise<AdminUser | null> {
    const userByEmail = await this.adminUserRepository.findOne({
      where: { email: authUser.email.toLowerCase() },
    });

    if (!userByEmail) return null;

    this.logger.warn(
      `ID mismatch | email=${authUser.email} | localId=${userByEmail.id} | authifyId=${authUser.id} | keeping local ID`,
    );
    await this.adminUserRepository.update(userByEmail.id, {
      name: authUser.name || userByEmail.name,
      lastLoginAt: new Date(),
    });
    authUser.id = userByEmail.id;
    return userByEmail;
  }

  private async updateExistingUser(existingUser: AdminUser, authUser: AuthUser): Promise<void> {
    await this.adminUserRepository.update(existingUser.id, {
      email: authUser.email.toLowerCase(),
      name: authUser.name || existingUser.name,
      lastLoginAt: new Date(),
    });
  }

  private async createNewUser(authUser: AuthUser): Promise<void> {
    const newUser = this.adminUserRepository.create({
      id: authUser.id,
      email: authUser.email.toLowerCase(),
      name: authUser.name,
      emailVerified: true,
      provider: 'authify',
      lastLoginAt: new Date(),
    });
    await this.adminUserRepository.save(newUser);
  }
}
