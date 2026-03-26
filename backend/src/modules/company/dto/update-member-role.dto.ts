import { IsEnum } from 'class-validator';
import { CompanyRole } from '../../../database/entities/company-role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(CompanyRole)
  role!: CompanyRole;
}
