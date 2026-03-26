import { IsUUID } from 'class-validator';

export class RefreshDto {
  @IsUUID()
  user_id!: string;
}
