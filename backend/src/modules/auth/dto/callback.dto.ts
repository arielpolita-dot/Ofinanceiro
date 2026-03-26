import { IsString, IsNotEmpty } from 'class-validator';

export class CallbackDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
