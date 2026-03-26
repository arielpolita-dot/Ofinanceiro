/**
 * ==============================================================================
 * AdminController - Endpoints de Administração
 * ==============================================================================
 *
 * Endpoints para dashboard administrativo do sistema.
 * Todos os endpoints requerem autenticação via AuthGuard (cookie httpOnly).
 *
 * ## Endpoints
 *
 * | Método | Rota             | Descrição                   |
 * |--------|------------------|-----------------------------|
 * | GET    | /admin/stats     | Estatísticas gerais         |s
 * | GET    | /admin/dashboard | Dashboard completo          |ok
 *
 * ## Autenticação
 *
 * Requer cookie httpOnly app_access_token ou Bearer token.
 *
 * @module admin
 * @see {@link AdminService} para lógica de negócio
 * @see {@link AuthGuard} para autenticação
 */
import { Controller, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminUser } from '../../database/entities';

interface AuthRequest extends ExpressRequest {
  adminUser?: AdminUser;
}

/**
 * =========================================================================
 * AdminController - Controller de Administração
 * =========================================================================
 *
 * Expõe endpoints para visualização administrativa.
 *
 * @class AdminController
 */
@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/stats
   * Retorna estatísticas gerais do sistema.
   */
  @Get('stats')
  async getStats(@Request() req: AuthRequest) {
    if (!req.adminUser?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.adminService.getStats(req.adminUser.id);
  }

  /**
   * GET /admin/dashboard
   * Retorna dados completos do dashboard.
   */
  @Get('dashboard')
  async getDashboard(@Request() req: AuthRequest) {
    if (!req.adminUser?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.adminService.getDashboard(req.adminUser.id);
  }
}
