import { SetMetadata } from '@nestjs/common';
import { CompanyRole } from '../../database/entities/company-role.enum';

export const COMPANY_ROLES_KEY = 'companyRoles';

/**
 * Decorator to specify required company roles for an endpoint.
 * Used together with CompanyGuard.
 *
 * @example
 * @CompanyRoles(CompanyRole.OWNER, CompanyRole.ADMIN)
 * @UseGuards(AuthGuard, CompanyGuard)
 * async updateCompany() {}
 */
export const CompanyRoles = (...roles: CompanyRole[]) =>
  SetMetadata(COMPANY_ROLES_KEY, roles);
