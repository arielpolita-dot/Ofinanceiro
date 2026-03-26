import { IsEmail, IsEnum } from 'class-validator';
import { CompanyRole } from '../../../database/entities/company-role.enum';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(CompanyRole)
  role!: CompanyRole;
}
