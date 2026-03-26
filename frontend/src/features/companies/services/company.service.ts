import { api } from '../../../services/api'
import type {
  Company, CompanyMember, CompanyInvite,
  CreateCompanyDto, UpdateCompanyDto,
  InviteMemberResult, InviteInfo,
} from './company.types'

export const companyService = {
  getAll: () =>
    api.get<Company[]>('/companies'),

  getById: (id: string) =>
    api.get<Company>(`/companies/${id}`),

  create: (data: CreateCompanyDto) =>
    api.post<Company>('/companies', data),

  update: (id: string, data: UpdateCompanyDto) =>
    api.patch<Company>(`/companies/${id}`, data),

  delete: (id: string) =>
    api.delete(`/companies/${id}`),

  switchCompany: (id: string) =>
    api.post<{ token: string }>(`/companies/${id}/switch`),

  getMembers: (id: string) =>
    api.get<CompanyMember[]>(`/companies/${id}/members`),

  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post<InviteMemberResult>(`/companies/${id}/members`, data),

  updateMemberRole: (id: string, userId: string, data: { role: string }) =>
    api.patch(`/companies/${id}/members/${userId}`, data),

  removeMember: (id: string, userId: string) =>
    api.delete(`/companies/${id}/members/${userId}`),

  getInvites: (id: string) =>
    api.get<CompanyInvite[]>(`/companies/${id}/invites`),

  cancelInvite: (id: string, inviteId: string) =>
    api.delete(`/companies/${id}/invites/${inviteId}`),

  getInviteInfo: (token: string) =>
    api.get<InviteInfo>(`/companies/invites/${token}/info`),

  acceptInvite: (token: string) =>
    api.post<{ status: string; companyId: string; role: string }>(
      `/companies/invites/${token}/accept`,
    ),
}
