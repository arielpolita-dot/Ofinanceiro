import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyMemberService } from '../../modules/company/company-member.service';
import { CompanyRole } from '../../database/entities/company-role.enum';
import { COMPANY_ROLES_KEY } from '../decorators/company-roles.decorator';

/**
 * Guard that validates company membership and role.
 *
 * Extracts companyId from route param `:id` or `req.user.projectId`.
 * Attaches `req.company = { id, role }` on success.
 * Works with @CompanyRoles() decorator for role-based access.
 */
@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(
    private readonly memberService: CompanyMemberService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const companyId = this.extractCompanyId(request);
    if (!companyId) {
      throw new ForbiddenException('Company context required');
    }

    const role = await this.memberService.getMemberRole(companyId, user.id);
    if (!role) {
      throw new ForbiddenException('Not a member of this company');
    }

    this.validateRequiredRoles(context, role);

    request.company = { id: companyId, role };
    return true;
  }

  private extractCompanyId(request: any): string | undefined {
    return request.params?.id || request.user?.projectId;
  }

  private validateRequiredRoles(context: ExecutionContext, role: CompanyRole): void {
    const requiredRoles = this.reflector.get<CompanyRole[] | undefined>(
      COMPANY_ROLES_KEY,
      context.getHandler(),
    );

    if (requiredRoles?.length && !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient company permissions');
    }
  }
}
