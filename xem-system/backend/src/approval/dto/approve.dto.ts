import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApproveDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Decision must not exceed 500 characters' })
  decision?: string;
}
