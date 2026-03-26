import { ForbiddenException } from '@nestjs/common';
import { CompanyGuard } from './company.guard';
import { CompanyRole } from '../../database/entities/company-role.enum';
import { Reflector } from '@nestjs/core';

const mockMemberService = {
  getMemberRole: jest.fn(),
};

const mockReflector = {
  get: jest.fn(),
};

function createMockContext(params: Record<string, string>, user?: { id: string }) {
  const request = { params, user, company: undefined as any };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
  } as any;
}

describe('CompanyGuard', () => {
  let guard: CompanyGuard;

  beforeEach(() => {
    guard = new CompanyGuard(
      mockMemberService as any,
      mockReflector as unknown as Reflector,
    );
    jest.clearAllMocks();
  });

  it('should throw ForbiddenException if no user', async () => {
    const ctx = createMockContext({ id: 'c1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not a member', async () => {
    const ctx = createMockContext({ id: 'c1' }, { id: 'u1' });
    mockMemberService.getMemberRole.mockResolvedValue(null);
    mockReflector.get.mockReturnValue(undefined);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access and attach company to request', async () => {
    const ctx = createMockContext({ id: 'c1' }, { id: 'u1' });
    mockMemberService.getMemberRole.mockResolvedValue(CompanyRole.ADMIN);
    mockReflector.get.mockReturnValue(undefined);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.company).toEqual({ id: 'c1', role: CompanyRole.ADMIN });
  });

  it('should check required roles when @CompanyRoles is set', async () => {
    const ctx = createMockContext({ id: 'c1' }, { id: 'u1' });
    mockMemberService.getMemberRole.mockResolvedValue(CompanyRole.MEMBER);
    mockReflector.get.mockReturnValue([CompanyRole.OWNER, CompanyRole.ADMIN]);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow when user role matches required roles', async () => {
    const ctx = createMockContext({ id: 'c1' }, { id: 'u1' });
    mockMemberService.getMemberRole.mockResolvedValue(CompanyRole.OWNER);
    mockReflector.get.mockReturnValue([CompanyRole.OWNER]);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should use projectId from user when no route param', async () => {
    const ctx = createMockContext({}, { id: 'u1' });
    const request = ctx.switchToHttp().getRequest();
    request.user = { id: 'u1', projectId: 'c2' };
    mockMemberService.getMemberRole.mockResolvedValue(CompanyRole.MEMBER);
    mockReflector.get.mockReturnValue(undefined);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockMemberService.getMemberRole).toHaveBeenCalledWith('c2', 'u1');
  });
});
