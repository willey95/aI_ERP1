import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TransferType {
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
}

export class CreateBudgetTransferDto {
  @IsNotEmpty({ message: 'Source budget item ID is required' })
  @IsString()
  sourceItemId: string;

  @IsNotEmpty({ message: 'Target budget item ID is required' })
  @IsString()
  targetItemId: string;

  @IsNotEmpty({ message: 'Transfer amount is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsNotEmpty({ message: 'Transfer type is required' })
  @IsEnum(TransferType, { message: 'Transfer type must be either PARTIAL or FULL' })
  transferType: TransferType;

  @IsNotEmpty({ message: 'Reason is required' })
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  executionRequestId?: string;
}
