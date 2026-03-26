/**
 * Roles that a user can have within a company.
 *
 * - OWNER: Full control, can delete company and manage all members
 * - ADMIN: Can manage members (invite/remove) and update company settings
 * - MEMBER: Read access and basic operations within the company
 */
export enum CompanyRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
