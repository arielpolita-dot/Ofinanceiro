import {
  Controller, Get, Post, Body, Res, Req, UseGuards,
  HttpCode, HttpStatus, Logger, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthBffService } from './auth-bff.service';
import { StrictThrottle, SkipThrottle } from '../../common/decorators/throttle.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { extractToken } from '../../common/utils/extract-token.util';
import { CallbackDto, RefreshDto } from './dto';
import { CompanyMember } from '../../database/entities/company-member.entity';

const COOKIE_NAME = 'app_access_token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Auth BFF controller — exposes OAuth endpoints for the frontend.
 * Uses httpOnly cookies for access_token storage (XSS protection).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthBffController {
  private readonly logger = new Logger(AuthBffController.name);
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly authBffService: AuthBffService,
    private readonly configService: ConfigService,
    @InjectRepository(CompanyMember)
    private readonly memberRepository: Repository<CompanyMember>,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  /** Sets httpOnly secure cookie with the access_token. */
  private setAccessTokenCookie(res: Response, accessToken: string, expiresInSec?: number): void {
    const maxAge = expiresInSec ? expiresInSec * 1000 : COOKIE_MAX_AGE;
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true, secure: true, sameSite: 'none', maxAge, path: '/',
    });
  }

  /** Clears the access_token cookie (logout/session expiry). */
  private clearAccessTokenCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true, secure: true, sameSite: 'none', path: '/',
    });
  }

  /** Extracts token from httpOnly cookie (priority) or Authorization header (fallback). */
  private extractTokenFromRequest(req: Request): string | null {
    return extractToken(req);
  }

  /** GET /api/auth/login — Redirects user to Authify login page. */
  @Get('login')
  @ApiOperation({ summary: 'Redirect to Authify login' })
  @ApiResponse({ status: 302, description: 'Redirects to Authify hosted login' })
  async login(@Res() res: Response) {
    try {
      const loginUrl = await this.authBffService.getLoginUrl();
      res.redirect(loginUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate login URL';
      res.redirect(`${this.frontendUrl}?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /** GET /api/auth/register — Redirects user to Authify register page. */
  @Get('register')
  @ApiOperation({ summary: 'Redirect to Authify register' })
  @ApiResponse({ status: 302, description: 'Redirects to Authify hosted register' })
  async register(@Res() res: Response) {
    try {
      const registerUrl = await this.authBffService.getRegisterUrl();
      res.redirect(registerUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate register URL';
      res.redirect(`${this.frontendUrl}?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /** POST /api/auth/callback — Exchanges OAuth code for access_token (set in httpOnly cookie). */
  @Post('callback')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange authorization code for access token' })
  @ApiBody({ schema: { type: 'object', properties: { code: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Returns user info (token set in httpOnly cookie)' })
  @ApiResponse({ status: 401, description: 'Invalid code' })
  async callback(
    @Body() dto: CallbackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const code = dto.code;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`[CALLBACK] START | code=${code.substring(0, 12)}... | ip=${ipAddress}`);

    const redirectUri = `${this.frontendUrl}/auth/callback`;

    try {
      const { accessToken, user, expiresIn } = await this.authBffService.exchangeCodeForTokens(
        code, redirectUri, ipAddress, userAgent,
      );
      this.logger.log(`[CALLBACK] OK | user=${user.email}`);
      this.setAccessTokenCookie(res, accessToken, expiresIn);
      return { token_type: 'Bearer', user };
    } catch (error) {
      this.logger.error(`[CALLBACK] ERROR | ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /** GET /api/auth/status — Checks if user is authenticated (no exception on failure). */
  @Get('status')
  @SkipThrottle()
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ status: 200, description: 'Authentication status with companies' })
  async status(@Req() req: Request) {
    const accessToken = this.extractTokenFromRequest(req);

    if (!accessToken) {
      return { authenticated: false };
    }

    const user = await this.authBffService.validateAccessToken(accessToken);
    if (!user) {
      return { authenticated: false };
    }

    const companies = await this.getUserCompanies(user.id);
    const activeCompanyId = user.projectId || companies[0]?.id || null;

    return { authenticated: true, user, companies, activeCompanyId };
  }

  /** Fetches companies the user belongs to with their roles. */
  private async getUserCompanies(userId: string) {
    try {
      const memberships = await this.memberRepository.find({
        where: { userId },
        relations: ['company'],
      });
      return memberships.map((m) => ({
        id: m.companyId,
        name: m.company.name,
        role: m.role,
      }));
    } catch {
      return [];
    }
  }

  /** POST /api/auth/refresh — Refreshes access_token using stored refresh_token. */
  @Post('refresh')
  @UseGuards(AuthGuard)
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ schema: { type: 'object', properties: { user_id: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'New access token (set in httpOnly cookie)' })
  @ApiResponse({ status: 401, description: 'Session expired' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.id || dto.user_id;
    const result = await this.authBffService.refreshAccessToken(userId);

    if (!result) {
      this.clearAccessTokenCookie(res);
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    this.setAccessTokenCookie(res, result.accessToken, result.expiresIn);
    return { token_type: 'Bearer', user: result.user };
  }

  /** POST /api/auth/logout — Revokes session on Authify and clears httpOnly cookie. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = this.extractTokenFromRequest(req);
    if (accessToken) {
      const user = await this.authBffService.validateAccessToken(accessToken);
      if (user) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        await this.authBffService.logout(user.id, ipAddress, userAgent);
      }
    }

    this.clearAccessTokenCookie(res);
    return { success: true, message: 'Logged out successfully' };
  }
}
