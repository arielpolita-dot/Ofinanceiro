import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSession } from '../../database/entities/admin-session.entity';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(AdminSession)
    private readonly sessionRepository: Repository<AdminSession>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findActiveSession(userId: string): Promise<AdminSession | null> {
    return this.sessionRepository.findOne({
      where: { adminUserId: userId, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    expiresInSec?: number,
  ): Promise<AdminSession> {
    const deactivateResult = await this.sessionRepository.update(
      { adminUserId: userId, active: true },
      { active: false },
    );
    this.logger.log(`Deactivated ${deactivateResult.affected || 0} previous sessions`);

    const expiresInMs = expiresInSec ? expiresInSec * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);

    const session = this.sessionRepository.create({
      adminUserId: userId,
      refreshToken: this.encryptionService.encrypt(refreshToken),
      ipAddress,
      userAgent,
      expiresAt,
      active: true,
    });
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Created sessionId=${saved.id} | expiresAt=${expiresAt.toISOString()}`);
    return saved;
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, { active: false });
  }

  decryptRefreshToken(session: AdminSession): string {
    return this.encryptionService.decrypt(session.refreshToken);
  }

  async updateRefreshToken(sessionId: string, newToken: string, expiresInSec: number): Promise<void> {
    const expiresInMs = expiresInSec ? expiresInSec * 1000 : 24 * 60 * 60 * 1000;
    await this.sessionRepository.update(sessionId, {
      refreshToken: this.encryptionService.encrypt(newToken),
      expiresAt: new Date(Date.now() + expiresInMs),
    });
  }
}
