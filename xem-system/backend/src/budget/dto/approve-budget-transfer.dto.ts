import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class ApproveBudgetTransferDto {
  @IsNotEmpty({ message: 'Approval decision is required' })
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  decision?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
