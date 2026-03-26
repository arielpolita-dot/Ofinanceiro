import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CompanyContext {
  id: string;
  role: string;
}

/**
 * Parameter decorator to extract company context from request.
 * Must be used after CompanyGuard has run.
 *
 * @example
 * async getCompany(@CurrentCompany() company: CompanyContext) {
 *   console.log(company.id, company.role);
 * }
 */
export const CurrentCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CompanyContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.company;
  },
);
