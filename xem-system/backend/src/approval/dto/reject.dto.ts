import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MaxLength(1000, { message: 'Rejection reason must not exceed 1000 characters' })
  reason: string;
}
