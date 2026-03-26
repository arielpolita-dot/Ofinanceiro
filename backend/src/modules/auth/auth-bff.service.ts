import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityAction, ActivityResource } from '../../database/entities';
import { ActivityLogService } from '../../common/activity-log/activity-log.service';
import { ConversionsTrackingService } from '../../common/services/conversions-tracking.service';
import { fetchWithTimeout } from '../../common/utils/fetch-with-timeout.util';
import { maskToken } from '../../common/utils/mask-token.util';
import { AuthUser, TokenResponse } from './auth-bff.types';
import { SessionService } from './session.service';
import { UserSyncService } from './user-sync.service';

export { AuthUser } from './auth-bff.types';

/** BFF authentication service — orchestrates OAuth flow, token lifecycle, and logout. */
@Injectable()
export class AuthBffService {
  private readonly logger = new Logger(AuthBffService.name);
  private readonly authServiceUrl: string;
  private readonly authFrontendUrl: string;
  private readonly apiKey: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly userSyncService: UserSyncService,
    private readonly activityLogService: ActivityLogService,
    private readonly conversionsTracking: ConversionsTrackingService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTHIFY_URL') || '';
    this.authFrontendUrl = this.configService.get<string>('AUTHIFY_FRONTEND_URL') || '';
    this.apiKey = this.configService.get<string>('AUTHIFY_API_KEY') || '';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';

    if (!this.authServiceUrl) this.logger.warn('AUTHIFY_URL not configured');
    if (!this.authFrontendUrl) this.logger.warn('AUTHIFY_FRONTEND_URL not configured');
    if (!this.apiKey) this.logger.warn('AUTHIFY_API_KEY not configured');
  }

  async getLoginUrl(): Promise<string> {
    return this.getAuthUrl('login');
  }

  async getRegisterUrl(): Promise<string> {
    return this.getAuthUrl('register');
  }

  private async getAuthUrl(type: 'login' | 'register'): Promise<string> {
    const callbackUrl = `${this.frontendUrl}/auth/callback`;
    try {
      const response = await fetchWithTimeout(`${this.authServiceUrl}/auth/login-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify({ redirect_url: callbackUrl }),
      });
      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Failed to get ${type} URL: ${JSON.stringify(error)}`);
        throw new Error(error.message || `Failed to generate ${type} URL`);
      }
      const data = await response.json();
      const url = data.loginUrl;
      return type === 'register' ? url.replace('/auth/login?', '/auth/register?') : url;
    } catch (error) {
      this.logger.error(`Failed to get ${type} URL: ${(error as Error).message}`);
      throw new Error(`Failed to generate ${type} URL. Please try again.`);
    }
  }

  async exchangeCodeForTokens(
    code: string, redirectUri: string, ipAddress?: string, userAgent?: string,
  ): Promise<{ accessToken: string; user: AuthUser; expiresIn: number }> {
    this.logger.log(`[EXCHANGE] START | code=${code.substring(0, 12)}... | redirect_uri=${redirectUri}`);

    try {
      const response = await fetchWithTimeout(`${this.authServiceUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`[EXCHANGE] FAILED | status=${response.status} | error=${JSON.stringify(error)}`);
        const errorMessage = error.error_code
          ? `${error.error_code}: ${error.error_description}`
          : (error.error_description || 'Token exchange failed');
        throw new UnauthorizedException(errorMessage);
      }

      const tokenResponse: TokenResponse = await response.json();
      this.logger.log(`[EXCHANGE] TOKEN OK | user=${tokenResponse.user.email} | expires_in=${tokenResponse.expires_in}s`);

      await this.userSyncService.ensureLocalUser(tokenResponse.user);

      const session = await this.sessionService.createSession(
        tokenResponse.user.id, tokenResponse.refresh_token, ipAddress, userAgent, tokenResponse.expires_in,
      );

      await this.activityLogService.log({
        userId: tokenResponse.user.id, userEmail: tokenResponse.user.email,
        action: ActivityAction.LOGIN, resourceType: ActivityResource.AUTH,
        ipAddress, userAgent, sessionId: session?.id,
        metadata: { details: { provider: 'authify' } }, success: true,
      });

      // Track registration conversion (fire-and-forget)
      this.conversionsTracking.trackCompleteRegistration({
        email: tokenResponse.user.email,
        externalId: tokenResponse.user.id,
        ip: ipAddress,
        userAgent,
      }).catch(() => {});

      return { accessToken: tokenResponse.access_token, user: tokenResponse.user, expiresIn: tokenResponse.expires_in };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[EXCHANGE] CATCH | error=${errMsg} | type=${error?.constructor?.name}`);

      await this.activityLogService.log({
        userEmail: null, action: ActivityAction.LOGIN_FAILED, resourceType: ActivityResource.AUTH,
        ipAddress, userAgent, metadata: { error: errMsg }, success: false, errorMessage: errMsg,
      });

      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateAccessToken(accessToken: string): Promise<AuthUser | null> {
    const tokenPreview = maskToken(accessToken);
    try {
      const response = await fetchWithTimeout(`${this.authServiceUrl}/auth/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const user = await response.json();
        return { id: user.id, email: user.email, name: user.name, avatar: user.avatar, projectId: user.projectId };
      }

      const errorBody = await response.text().catch(() => 'unreadable');
      this.logger.warn(`[VALIDATE-TOKEN] FAILED | status=${response.status} | body=${errorBody.substring(0, 200)}`);
      return null;
    } catch (error) {
      this.logger.error(`[VALIDATE-TOKEN] ERROR | ${error instanceof Error ? error.message : error} | token=${tokenPreview}`);
      return null;
    }
  }

  async refreshAccessToken(userId: string): Promise<{ accessToken: string; user: AuthUser; expiresIn: number } | null> {
    const session = await this.sessionService.findActiveSession(userId);

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.sessionService.deactivateSession(session.id);
      return null;
    }

    try {
      const decryptedToken = this.sessionService.decryptRefreshToken(session);
      const response = await fetchWithTimeout(`${this.authServiceUrl}/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: decryptedToken }),
      });

      if (!response.ok) {
        await this.sessionService.deactivateSession(session.id);
        return null;
      }

      const tokenResponse: TokenResponse = await response.json();
      await this.sessionService.updateRefreshToken(session.id, tokenResponse.refresh_token, tokenResponse.expires_in);

      return { accessToken: tokenResponse.access_token, user: tokenResponse.user, expiresIn: tokenResponse.expires_in };
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${(error as Error).message}`);
      return null;
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const session = await this.sessionService.findActiveSession(userId);

    if (session) {
      try {
        const decryptedToken = this.sessionService.decryptRefreshToken(session);
        await fetchWithTimeout(`${this.authServiceUrl}/auth/token/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: decryptedToken }),
        });
      } catch (error) {
        this.logger.error(`Failed to revoke token on Auth: ${(error as Error).message}`);
      }
      await this.sessionService.deactivateSession(session.id);
    }

    await this.activityLogService.log({
      userId, action: ActivityAction.LOGOUT, resourceType: ActivityResource.AUTH,
      ipAddress, userAgent, sessionId: session?.id, success: true,
    });
  }
}
