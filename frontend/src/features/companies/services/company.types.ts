export interface Company {
  id: string
  name: string
  slug: string
  document?: string
  description?: string
  logoUrl?: string
  ownerId?: string
  role: string
}

export interface CompanyMember {
  id: string
  userId: string
  email: string
  name: string
  role: string
  joinedAt: string
}

export interface CreateCompanyDto {
  name: string
  document?: string
  description?: string
  website?: string
  industry?: string
}

export interface UpdateCompanyDto {
  name?: string
  description?: string
  website?: string
  industry?: string
}

export interface CompanyInvite {
  id: string
  companyId: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired' | 'canceled'
  createdAt: string
  expiresAt: string
}

export interface InviteInfo {
  companyName: string
  inviterName: string
  email: string
  status: 'pending' | 'accepted' | 'expired' | 'canceled'
  expiresAt: string
}

export interface InviteMemberResult {
  status: 'added' | 'invited'
  member?: CompanyMember
  invite?: CompanyInvite
}
